phantom
=======

An NPM wrapper for [PhantomJS](phantomjs.org), headless webkit with JS API.

Building and Installing
-----------------------

```shell
npm install phantomjs
```

Or grab the source and

```shell
node ./install.js
```

What this is really doing is just grabbing a particular "blessed" (by
this module) version of Phantom. As new versions of Phantom are released
and vetted, this module will be updated accordingly.

NOTE: Currently this has only been set up to fetch and run Phantom for MacOS
(darwin) and Linux based platforms (as identified by nodejs).  If you want
windows support, feel free to send a patch.

Running
-------

```shell
bin/phantom [phantom arguments]
```

And npm will install a link to the binary in `node_modules/.bin` as
it is wont to do.

Contributing
------------

Questions, comments, bug reports, and pull requests are all welcome.
Submit them at [the project on GitHub](https://github.com/Obvious/phantom/).

Bug reports that include steps-to-reproduce (including code) are the
best. Even better, make them in the form of pull requests.

Author
------

[Dan Pupius](https://github.com/dpup)
([personal website](http://pupius.co.uk)), supported by
[The Obvious Corporation](http://obvious.com/).

License
-------

Copyright 2012 [The Obvious Corporation](http://obvious.com/).

Licensed under the Apache License, Version 2.0. 
See the top-level file `LICENSE.txt` and
(http://www.apache.org/licenses/LICENSE-2.0).
