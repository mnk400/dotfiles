#!/bin/bash
#Script to auto update all the tracked files in my dot file repository

#Creating a commit message
messageStr="Scripted Auto Update: $(date)"

#Adding all the tracked files
#yadm add /Users/manik/Library/Mobile\ Documents/com~apple~CloudDocs/Projects/scripts
#yadm add ~/.vim
yadm add -u


#Committing
yadm commit -m "$messageStr"

#Pushing to github
yadm push

echo "Pushed to Github"
