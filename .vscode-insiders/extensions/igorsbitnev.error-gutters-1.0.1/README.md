[![](https://vsmarketplacebadge.apphb.com/version/IgorSbitnev.error-gutters.svg)](https://marketplace.visualstudio.com/items?itemName=IgorSbitnev.error-gutters)
[![](https://vsmarketplacebadge.apphb.com/installs/IgorSbitnev.error-gutters.svg)](https://marketplace.visualstudio.com/items?itemName=IgorSbitnev.error-gutters)

# Error Gutters
This is the VSCodium (or Visual Studio Code) version of error gutters available in other text editors, such as Sublime Text or Atom.

## Features
This extension put gutters to the right from the line of code, containing any diagnostic issue. It uses diagnostics API so it's language and extension agnostic - it's compatible with any extension which provides diagnostics (ESLint for instance) and each line with issues will have own gutter. There are 3 different gutters for each of severity levels - Error, Warning, and Info.

Example:

![Example Usage](https://github.com/PinkaminaDianePie/error-gutters/raw/master/example.png)

## Known issues
Due to limitations in the gutter API, it's impossible to have multiple gutters for the line one code, so it may overlap other extensions which use gutters or conflict with breakpoint functionality.


