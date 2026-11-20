// Parameters for soliton distribution
const CONSTANT = 0.01;
const DELTA = 0.05;

export function createFountain(content, dropletLength) {
  // Encode the content into binary and then divide it into equal sized source chunks
  // If the length isn't a multiple of the chunk size, pad the last chunks with extra zeros
  const encoded = new TextEncoder().encode(content);
  const chunkLength = dropletLength - 8;
  let chunks = [];
  let processedLength = 0;

  while (processedLength < encoded.length) {
    const nextProcessedLength = processedLength + chunkLength;
    const chunk = new Uint8Array(chunkLength);
    chunk.set(encoded.slice(processedLength, nextProcessedLength));
    chunks.push(chunk);
    processedLength = nextProcessedLength;
  }

  // Samples a random number and combination of source chunks to be used for each droplet
  const sampleChunks = chunksSampler(chunks.length);

  return () => {
    // Randomly choose the source chunks to be used for the droplet
    const seed = Math.floor(Math.random() * 0xFFFFFFFF + 1);
    const sampledChunks = sampleChunks(seed).map(item => chunks[item]);

    const droplet = new Uint8Array(dropletLength);

    // Add the seed and total content length to the header
    const view = new DataView(droplet.buffer);
    view.setUint32(0, encoded.length);
    view.setUint32(4, seed);

    // Combine the source chunks together using XOR
    for (let i = 0; i < chunkLength; i++) {
      droplet[i + 8] = sampledChunks.reduce((accumulatedValue, sampledChunk) => accumulatedValue ^ sampledChunk[i], 0);
    }

    return droplet;
  };
}

// Decodes droplets by Gaussian elimination over GF(2). Each droplet is an equation saying which
// source chunks XOR together to give its content. Once there are as many independent equations as
// chunks, every chunk can be solved. The rank (independent equations so far) out of the chunk count
// is exact progress, available through receive.progress().
export function receiveFountain() {
  let chunkCount = 0;
  let chunkLength = 0;
  let totalLength = 0;
  let words = 0;
  let sampleChunks;
  let pivots; // pivots[c]: the equation whose lowest chunk is c
  let rank = 0;
  let result = null;
  const seenSeeds = new Set();

  const receive = (droplet) => {
    if (result !== null) return result;

    // Parse the total message length and seed out of the droplet
    const view = new DataView(droplet.buffer, droplet.byteOffset, droplet.byteLength);
    const seed = view.getUint32(4);
    const content = droplet.slice(8);

    if (!sampleChunks) {
      totalLength = view.getUint32(0);
      chunkLength = content.length;
      chunkCount = Math.ceil(totalLength / chunkLength);
      words = Math.ceil(chunkCount / 32);
      sampleChunks = chunksSampler(chunkCount);
      pivots = new Array(chunkCount);
    }

    // The camera reads the same QR code on many frames; only use each droplet once
    if (seenSeeds.has(seed)) return null;
    seenSeeds.add(seed);

    // Mark the source chunks used in the droplet, determined from the seed
    const mask = new Uint32Array(words);
    for (const chunk of sampleChunks(seed)) mask[chunk >>> 5] |= 1 << (chunk & 31);

    // Eliminate chunks that already have an equation, lowest first. An equation never contains
    // chunks below its own pivot, so XORing it in never brings back a chunk already cleared.
    // The first chunk with no equation yet makes this droplet that chunk's equation.
    // If every chunk is eliminated, the droplet only repeated information already received.
    for (let c = 0; c < chunkCount; c++) {
      const w = c >>> 5;
      if (mask[w] === 0) { c = w * 32 + 31; continue; }
      if (((mask[w] >>> (c & 31)) & 1) === 0) continue;

      const pivot = pivots[c];
      if (!pivot) {
        pivots[c] = { mask, content };
        rank++;
        break;
      }
      for (let i = w; i < words; i++) mask[i] ^= pivot.mask[i];
      for (let i = 0; i < chunkLength; i++) content[i] ^= pivot.content[i];
    }

    if (rank < chunkCount) return null;

    // Back-substitute from the last chunk up, so each equation is left holding just its own chunk
    for (let c = chunkCount - 1; c >= 0; c--) {
      const { mask, content } = pivots[c];
      for (let d = c + 1; d < chunkCount; d++) {
        if ((mask[d >>> 5] >>> (d & 31)) & 1) {
          const solved = pivots[d].content;
          for (let i = 0; i < chunkLength; i++) content[i] ^= solved[i];
        }
      }
    }

    const encoded = new Uint8Array(chunkCount * chunkLength);
    for (let c = 0; c < chunkCount; c++) encoded.set(pivots[c].content, c * chunkLength);

    result = new TextDecoder().decode(encoded.slice(0, totalLength));
    return result;
  };

  receive.progress = () => ({ rank, total: chunkCount });
  return receive;
}

function chunksSampler(count) {
  // Calcualte the robust soliton distribution of degrees used
  const R = CONSTANT * Math.log(count / DELTA) * Math.sqrt(count);

  const distribution = [];
  let sum = 0;

  for (let i = 1; i <= count; i++) {
    let weight;

    // Calculate ideal weights
    if (i === 1) {
      weight = 1 / count;
    } else {
      weight = 1 / (i * (i - 1));
    }

    // Add robust factor
    if (i < Math.floor(count / R)) {
      weight += R / (i * count);
    } else if (i === Math.floor(count / R)) {
      weight += R * Math.log(R / DELTA) / count;
    }

    sum += weight;
    distribution.push(weight);
  }

  // Normalize the values and calculate the cumulative distribution
  let total = 0;
  const cumulative = distribution.map(item => total += item / sum);
  cumulative[cumulative.length - 1] = 1; // Most practical way to deal with floating point errors

  return (seed) => {
    // Provides a random value using splitmix32
    const random = () => {
      seed |= 0;
      seed = seed + 0x9e3779b9 | 0;
      let t = seed ^ seed >>> 16;
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    };

    // Choose a degree based on the cumulative soliton distribution
    // The degree is the number of source chunks that will be sampled
    const r = random();
    const degree = cumulative.findIndex(c => r < c) + 1;

    // Sample the unique source chunks
    const usedIndexes = [];
    const unusedIndexes = [...Array(count).keys()];

    for (let a = 0; a < degree; a++) {
      let b = Math.floor(random() * unusedIndexes.length);
      usedIndexes.push(unusedIndexes[b]);
      unusedIndexes.splice(b, 1);
    }

    return usedIndexes;
  };
}
