# [PPM/PGM Viewer for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ngtystr.ppm-pgm-viewer-for-vscode)

Built by [Yoshietru Nagata](https://github.com/nagata-yoshiteru) 🇯🇵 , [Ben Weisz](https://github.com/BenWeisz) 🇨🇦 and [Kensuke Suzuki](https://szk18.github.io/) 🇯🇵


## Features

- View .ppm/.pgm images in the supported formats:
    - PPM (P2, P3)
    - PGM (P5, P6)
- Zoom and Scroll
    - Use the zoom panel to zoom in, out or reset your zoom level
    - Use your scroll wheel or drag your mouse to pan around once zoomed in
    - Use `Ctrl` key + mouse scroll wheel to zoom in and out
- Configure the color for your zoom panel
- Auto refresh viewer when an image file has changes
- Save an image as PNG format

## Extension Settings

- `ppm-pgm-viewer-for-vscode.imagepreview.panelBackgroundColor`: Zoom panel background color (default is `#ec5340`)
- `ppm-pgm-viewer-for-vscode.imagepreview.panelButtonColor` : Zoom panel button color (default is `#dd4535`)
- `ppm-pgm-viewer-for-vscode.imagepreview.defaultPreviewScale` : Default zoom level for image preview (default is 1.0)
- `ppm-pgm-viewer-for-vscode.imagepreview.autoScalingMode` : Whether to use Auto Scaling Mode (default is false)
- `ppm-pgm-viewer-for-vscode.imagepreview.uiPosition` : Panel UI position. (default is `left`)

## Known Issues
 - None that we know of, but feel free to leave us a github issue :)

## Release Notes

## 0.0.9

- Add save as PNG feature

## 0.0.8

- Auto refresh viewer when a image file has changes

## 0.0.7

- Zoom in and out with `Ctrl` key + mouse scroll
- Security fix

## 0.0.6

- Bugfix for loading headers of commented imgs

## 0.0.5

- Add image scrolling and panning
- Add zoom panel overlay
- Add zoom panel color configuration
- Add support for P2, P3 formats
- Improve file endings support

## 0.0.4

- Use VSCode Editor API for image viewer

## 0.0.3

- Add Zoom feature

### 0.0.2

- Change behavior when opening unsupported file
- Add image information display
- Add LICENSE
- Refactor

### 0.0.1

- Initial beta release
