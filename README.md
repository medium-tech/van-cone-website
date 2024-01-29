# Van Cone Website

Source code for building, deploying and serving the van cone website.

See the website live at: [medium-tech.github.io/van-cone-website](https://medium-tech.github.io/van-cone-website/)

# Overview

Most of the website is autogenerated using the npm package [marked](https://www.npmjs.com/package/marked) from the van cone markdown docs. The official [van-cone](https://github.com/medium-tech/van-cone) repository is a submodule of this repo and contains the official docs in markdown format. 

The `./assets` folder in this repository contains the index html file, css file and images for the website. The `./src/render.js` file converts each markdown document into an html page and adds the sidebar html. It outputs each of the files and copies necessary files from `./assets` into the `./docs` folder which github uses as the root directory for serving the webpage.

# Development

This command will build the website everytime filesystem changes are detected, requires [fswatch](https://github.com/emcrisostomo/fswatch) to be installed on your system.

```bash
npm run dev
```

Open a second terminal and run this command to preview the site in your browser

```bash
npm run preview
```

Or if you just want to build the site once:

```bash
npm run build
```