# Not tied to Lerna....
I think its a bad idea to build bnd tightly coupled to lerna.
With Lerna, yarn, NPM 7 and the potential to adapt this for monorepos other than nodejs... There are loads of differences nuiances etc... We have greate understanding of what changed via crawling the git changesets... We have solid tools for understanding the semantic differences in each commit... What we are missing is the understanding what packages exist in the repo...

# List packages
- Order of precedence
    - is npm workspaces available???
        - if so use npm workspaces
    - are we using yarn 
    - look for lerna's existence


Both yarn and npm are handling the packages and letting lerna handle the higher level bits (lerna list, version, changed)



---

Retrieve Packages
- Find workspaces glob
    - supported: 
        - npm 7 (workspaces prop in package.json)
        - yarn (workspaces prop in package.json)
        - lerna (packages prop in lerna.json)