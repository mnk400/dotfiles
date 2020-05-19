#!/bin/bash
#Script to auto update all the tracked files in my dot file repository

if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters"
fi

#Creating a commit message
messageStr="Scripted Auto Update: $(date)"

#Adding all the tracked files
yadm add -u


#Committing
yadm commit -m "$messageStr"

#Pushing to github
yadm push

echo "Pushed to Github"
