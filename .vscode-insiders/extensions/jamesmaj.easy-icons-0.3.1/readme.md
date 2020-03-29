# Easy icons

Easy icons is a simple icon theme for visual studio code. Easy icons has two goals:

## Goal 1 - Make it easier to recognise files in the file explorer  
Icons beside file names make it easier to find files by their extension.

![capture](https://cloud.githubusercontent.com/assets/22332883/21157849/d152203c-c1df-11e6-8afe-8e48c07808a0.PNG)

## Goal 2 - Make it easy to add missing icons  
Easy icons has a simple directory structure to make customisation easy. To add your own icon to the package:

1. Add custom icon to the `.\images\` folder. SVG icons are recommended, PNG is fine.

2. Open `icon-assignments.json`

3. In the *Icon definitions* section add an entry in the following way (replace `icontag` and `customicon.svg`):

```json
    "_icontag": {"iconPath": "./icons/customicon.svg"},
```

4. In the *File associations* section, add an entry (replacing `ext` with the extension you wish customise and `icontag` with the icontag from step 3):

```json
    "ext": "_icontag",
```

## Current icon support
Currently only a small sample of icons is available. These are the icons that I see most commonly. I will be updating the package with icons (especially for languages) regularly, although I have tried to make it as simple as possible for you to add in your own icons as you need them.  
Enjoy!