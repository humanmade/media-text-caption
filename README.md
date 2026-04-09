# Media & Text Caption

A WordPress must-use plugin that adds an editable figcaption to the core **Media & Text** block (`core/media-text`).

## Features

- **Toggle** in the block sidebar to show or hide the caption
- **Editable text field** — caption is stored as a block attribute, independent of the media library
- **Auto-populated** from the attachment's caption when an image is selected (only if the field is empty)
- **Reset** to the library caption at any time via a link below the field
- Caption preview is **injected into the editor canvas** in real time
- Rendered on the **frontend** via a `render_block` filter — no theme changes required

## Requirements

- WordPress 6.4+
- Node.js 24+ (for building assets)

## Development

Install dependencies from the repository root (uses npm workspaces):

```bash
npm install
```

Build assets:

```bash
npm run build -w media-text-caption
```

Watch mode:

```bash
npm run start -w media-text-caption
```

## How it works

Two block attributes are registered on `core/media-text`:

| Attribute | Type | Description |
|---|---|---|
| `showMediaCaption` | `boolean` | Whether the caption is visible |
| `mediaCaption` | `string` | The caption text |

On the frontend, a `<figcaption class="wp-element-caption gfo-media-caption">` is injected after the `<figure>` element inside the block markup.

## License

GPL-2.0-or-later
