#!/bin/bash
HOST='squishypi.lan'
PATHTONAS='/Volumes/share/NAS'
#Checking if connected to the NAS
if ping -q -c 1 -W 1 $HOST >/dev/null; 
then	
	echo "$HOST online, checking if mounted"
	
	#Checking if the path to NAS exists, i.e. if it's mounted
	if [ -d $PATHTONAS ] 
	then
		    echo "NAS mounted at: $PATHTONAS"
		    #Running rsync
		    echo "Running rsync"
		    rsync -rtvu --delete /Users/manik/Documents/ /Volumes/share/NAS/Documents 
	else
		    echo "Error: NAS not mounted"
	fi
else
	#Quitting if not host not found online
	echo "$HOST not Found, can not sync. Quitting."
fi

