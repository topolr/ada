node ./node_modules/ada-pack/bin/run.js && node ./doc/ssr && git add dist && git subtree push --prefix dist origin gh-pages

git push origin/gh-pages `git subtree split --prefix dist master`:master --force