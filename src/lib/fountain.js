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

export function receiveFountain() {
  const eliminated = new Map();
  const buffer = [];
  let initiated = false;
  let sampleChunks;

  return (droplet) => {
    // Parse the total message length and seed out of the droplet
    const view = new DataView(droplet.buffer);
    const totalLength = view.getUint32(0);
    const seed = view.getUint32(4);
    const content = new Uint8Array(droplet.slice(8));
    const chunkCount = Math.ceil(totalLength / content.length);

    if (!initiated) {
      sampleChunks = chunksSampler(chunkCount);
      initiated = true;
    }

    // Determine the source chunks used in the droplet from the seed
    const sampledChunks = sampleChunks(seed);

    // If the droplet is made up of multiple source chunks, attempt to reduce it by the already eliminated chunks
    if (sampledChunks.length > 1) {
      for (const [k, v] of eliminated) {
        if (sampledChunks.includes(k)) {
          for (let i = 0; i < content.length; i++) {
            content[i] ^= v[i];
          }

          sampledChunks.splice(sampledChunks.indexOf(k), 1);
        }
      }
    }

    // If the droplet was eliminated to a single source chunk, use it to eliminate other buffered droplets
    // If we eliminate buffered droplets in this process, we'll recursively use them to eliminate more buffered droplets
    // Otherwise, if it was not fully eliminated, add the droplet to the buffer
    if (sampledChunks.length === 1) {
      eliminated.set(sampledChunks[0], content);
      let checks = [[sampledChunks[0], content]];

      while (checks.length > 0) {
        let [checkChunk, checkContent] = checks.pop();

        for (let a = 0; a < buffer.length; a++) {
          let [bufferChunks, bufferContent] = buffer[a];

          if (bufferChunks.includes(checkChunk)) {
            for (let b = 0; b < content.length; b++) {
              bufferContent[b] ^= checkContent[b];
            }

            bufferChunks.splice(bufferChunks.indexOf(checkChunk), 1);

            if (bufferChunks.length === 1) {
              checks.push([bufferChunks[0], bufferContent]);
              eliminated.set(bufferChunks[0], bufferContent);
              buffer.splice(a, 1);
              a--;
            }
          }
        }
      }
    } else {
      buffer.push([sampledChunks, content]);
    }

    if (eliminated.size === chunkCount) {
      const chunks = [...eliminated.entries()].sort((a, b) => a[0] - b[0]).map(([k, v]) => v);

      const encoded = new Uint8Array(chunkCount * content.length);

      for (let i = 0; i < chunks.length; i++) {
        encoded.set(chunks[i], i * content.length);
      }

      return new TextDecoder().decode(encoded.slice(0, totalLength));
    } else {
      return null;
    }
  };
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
