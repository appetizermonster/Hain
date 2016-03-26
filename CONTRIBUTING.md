# Contributing
Want to contribute to hain? Well, you've come to the right place!

# Issues
When opening an issue, please go by the following:

- Check if your issue has already been solved (search for the issue)
- Check that you are running the latest version of hain (we recommend running the latest installer). Your issue may be fixed after updating.
- Describe your problem in as much detail as possible
- If the issue is about an error/bug, please make the error message the issue’s title (i.e. `Error: Could not install package`)
- Don't open an issue about an issue with a package not shipped with hain
- Include your system specs (OS, RAM, arch and version of hain installed) in the issue description

# Pull requests
After forking and cloning your fork to a local machine, run the following:
```
$ cd <path-to-clone>
$ git remote add upstream https://github.com/appetizermonster/hain.git
$ git pull upstream develop
$ git checkout develop
$ git branch <your-feature-branch>
$ git checkout <your-feature-branch>
$ npm install -g electron
$ npm install
$ ...make your changes...
$ git push origin
```
When opening a pull request, please go by the following:

- All pull requests should merge into the develop branch
- Please check that you are not behind, by any number of commits, the branch you are merging into.
- Describe your pull request in as much detail as possible (what's been fixed or what has been added + usage). Include an issue reference if the pull request fixes an issue.
- If the pull request is to fix an error/bug, please include the error message in the issue's description if possible
- Include your system specs (OS, RAM and arch) in the issue description
- Check that the app can be built and ran successfully before submitting a pull request
- Check that the ci passes successfully. Fix any bugs in your code if our ci (appveyor) fails with an error that may have somthing to do with your added code.

