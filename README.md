# BuyFarm

BuyFarm is an early static HTML/CSS prototype for a farm-products storefront. It includes product pages, contact and order forms, and image assets.

## Project status

This repository is a front-end prototype, not a production e-commerce system. The forms and payment-related pages do not provide secure order processing or payment handling. Do not enter real personal or payment information.

## Current structure

The project currently contains standalone HTML pages, styles, and image assets in the repository root. Several filenames and page references do not appear to match (for example, links use names such as `home page.html` and `loginpage.html`, while similarly named files are extensionless). The stylesheet referenced by the pages also needs to be reconciled with the current file names. These should be corrected together before moving files into folders, so internal links and stylesheets are not broken.

## Suggested next organization

Once page links and stylesheet references are mapped and tested, group files into `pages/`, `css/`, and `assets/`. Keep a redirect or update every relative link when moving files.
