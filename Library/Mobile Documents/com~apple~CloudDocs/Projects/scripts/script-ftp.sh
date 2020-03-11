#!/bin/bash
HOST=192.168.0.5
USR=backupserver
PASSWORD=backup1
temp="backup $(date).zip"
FTPNAME="${temp// /_}"

echo $FTPNAME

zip -r backup.zip /home/$USER/Documents

ftp -inv $HOST <<EOF
user $USR $PASSWORD
cd files
put backup.zip $FTPNAME
bye
EOF

rm backup.zip

