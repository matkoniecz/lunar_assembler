# To rebuild code you need to run npm_replacement.py script!

Use `python3 npm_replacement.py` to do that.

# Welcome!

Contributions are highly welcomed!

Bug reports, pull requests are welcomed and invited.

For bigger changes I strongly encourage to create an issue first to review the idea.

Issues with scathing criticism of code quality are also welcomed, as long as you are specific and clear what is wrong and how it can be improved.

# License

Note that by contributing code you are licensing it to license used by this repository (AGPL).

# Installing development dependencies

`sudo npm install -g prettier`

# Detect code style issues

????

TODO: find JS linter

# Automatically reformat code to follow some sane coding style

`npx prettier --print-width 200 --write .`

Sadly, it is necessary to treat it as suggestions.

I failed to find for now to:

- allow multiline array definition, with one element per line
- avoid pointless splitting if statements into multiple lines just because limit of 80 characters was reached
