# Telescope

A QR code based scouting app, powered by fountain codes

## Editing the forms

The scouting questions live in two files:

- `src/forms/match.json` — the Match Scouting form
- `src/forms/pit.json` — the Pit Interview form

You can add, remove, reorder or change questions here without touching any code. After saving, the app must be rebuilt (`npm run build`) and redeployed for the change to show up.

### How a form file is laid out

A form is a list of **pages**. Each page has a `title` (shown above the questions) and a list of `questions`, shown in order.

```json
{
  "pages": [
    {
      "title": "Autonomous",
      "questions": [
        { "id": "autoPoints", "label": "Auto Points", "tableLabel": "Auto Pts", "type": "counter", "min": 0, "max": 300 },
        { "id": "intakeType", "label": "Intake Type", "tableLabel": "Intake", "type": "dropdown", "options": ["Over Bumper", "Depot"], "required": true }
      ]
    }
  ]
}
```

### Question settings

| Setting       | Needed?  | What it does |
|---------------|----------|--------------|
| `id`          | Yes      | The name the answer is saved under. Must be unique within the form, with no spaces (e.g. `autoPoints`). |
| `label`       | Yes      | The text shown above the question on the form. |
| `tableLabel`  | Optional | A shorter name for the column in the Records table. If left out, `label` is used. |
| `type`        | Yes      | What kind of input to show (see below). |
| `required`    | Optional | `true` means the scouter can't go to the next page until it's answered. Leave it out if the question is optional. |
| `min` / `max` | Optional | The lowest/highest number allowed (for `number` and `counter`). |
| `options`     | Dropdowns | The list of choices, e.g. `["Swerve", "Tank"]`. |
| `placeholder` | Optional | Grey hint text shown before anything is picked/typed (for `dropdown` and `notes`). |

### Question types

| `type`     | What the scouter sees | Saved as |
|------------|-----------------------|----------|
| `number`   | A box for typing a number (e.g. team number, score) | number |
| `counter`  | `+` / `−` buttons with a number in the middle | number |
| `dropdown` | A list to pick one choice from (needs `options`) | text |
| `switch`   | An on/off toggle | Yes / No |
| `notes`    | A multi-line text box for comments | text |

### Things to be careful about

- **Don't rename or remove `matchNumber`, `robotPosition` (match form) or `teamNumber` (both forms).** The Records table uses them for sorting.
- **Changing a form changes the data format.** Every device sharing data by QR code or TSV must be running the same version of the forms, or imports will be rejected.
- Watch your commas and quotes. Every question except the last one in a list needs a comma after its `}`. If the app fails to build after an edit, a missing or extra comma is the most likely cause.
- The scouter's name and the time the form was submitted are recorded automatically. They aren't questions, so they aren't in these files.
