# CS174A-Sharpshooter

## Beginning
To clone the project on your machine, run in the folder of your choice:

```
git clone https://github.com/brennakj3/CS174A-Sharpshooter.git
```

Then make sure to cd into the CS174A-Sharpshooter folder.
Then, replacing yourname with your name,  run:

```
git branch yourname
git checkout yourname
```

To double check you're on your new branch, run:

```
git branch -v
```
You should see a * next to the name of your new branch. 

## Committing/Pushing your branch 
Once you've made changes, there are a few steps before pushing your branch.

To check which files are currently staged to be committed, run:
```
git status
```
This will show the files that have changes that need to be committed. 
Use 'git add' to add the files that you want to push to main.
Typically you will just run 'git add .' to add all files in the current directory.

Then make your commit with a message saying what features you adjusted/added:
```
git commit -m "commit message"
```

Then you can push your commit to main with:
```
//replace mybranch with the name of your branch
git push origin mybranch  
```

Once you do this, you should be able to see your new branch commit on the github. 
