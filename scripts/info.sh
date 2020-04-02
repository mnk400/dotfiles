clear
read -r -d '' name <<- EOM 

• ▌ ▄ ·.  ▐ ▄ ▄ •▄ 
·██ ▐███▪•█▌▐██▌▄▌▪
▐█ ▌▐▌▐█·▐█▐▐▌▐▀▀▄·
██ ██▌▐█▌██▐█▌▐█.█▌
▀▀  █▪▀▀▀▀▀ █▪·▀  ▀
EOM

printf "%b" "$name"

RED='\033[0;31m'
GRN='\033[0;32m'
YLW='\033[0;33m'
BLU='\033[0;34m'
MAG='\033[0;35m'
CYN='\033[0;36m'
NOC='\033[0m'
 
printf "\n\n${RED} ━${GRN} ━${YLW} ━${BLU} ━${MAG} ━${CYN} ━\n\n"

printf "${RED}wm:         ${NOC}macOS\n"
printf "${RED}font:       ${NOC}Envy Code R\n"
printf "${RED}terminal:   ${NOC}iTerm2\n"
printf "${RED}date:       ${NOC}$(date "+%d %b")\n"
printf "${RED}resolution: ${NOC}2880x1800\n"
printf "${RED}uptime:     ${NOC}$(uptime | awk '{print $3}') Days\n"
