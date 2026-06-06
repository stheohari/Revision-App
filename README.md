# Module Revision Site

This code was written for revising the COM2109 module for the University of Sheffield, in future it may be broadened so that any module, course etc can be uploaded and used in the various features on this page.

## How to Use

### Setup

Download the code as a .zip or other package and open it locally.

Opening the code in VS Code or a similar IDE would be most advisable, as this allows it to be run easily using either features like Run Configurations on JetBrains IDEs or the Go Live extension on VS Code (recommended).

Run the code from `revisionApp.html`.

To get started quickly, you can use the upload feature on the website to upload the `com2109_full.json` file.

Please note that if you refresh the site at any point, it will clear the dataset (because there's no backend at current time).

### Uploading New Datasets

New datasets can be uploaded in `.json` files. Please see `example_extension.json` for examples of each data type for uploading. 

I recommend passing the example file into an AI agent, along with your questions / flashcards etc, and asking it to convert them into the format specified in the example file.

In future, the entire process could be integrated but I don't have time right now.

## AI Statement

Just to be totally transparent, I have used AI tools, mainly Google Gemini, throughout the process of creating this, in order to speed up things like writing basic code (eg. the Tailwind css used) and also generating all the generic questions etc found in the `com2109_full.json` file included in the package.
