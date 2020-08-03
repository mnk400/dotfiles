#!/bin/bash
#Script to auto update all the tracked files in my dot file repository

#Checking for a commit message
if [ "$#" -gt 1 ]; then
    echo "Illegal number of parameters"
    exit
fi

if [ "$#" == 0 ]; then
    msg="Scripted Auto Update"
elif [ "$#" == 1 ]; then
    msg="$1"
fi

#Copying settings over from the windows side
copywinsettings.sh

#Creating a commit message
commitMsg="$msg: $(date)"

#Adding all the tracked files
yadm add -u

#Committing
yadm commit -m "$commitMsg"

#Pushing to github
yadm push

echo "Pushed to Github"
