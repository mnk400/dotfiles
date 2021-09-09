RED='\033[0;31m'
GREEN='\033[0;32m'
ORANGE='\033[0;33m'
GRAY='\033[1;30m'
NC='\033[0m'

function echoInfo {
	echo -e "${GRAY}[ INFO ] ${NC}$1"
}

function echoWarn {
	echo -e "${ORANGE}[ WARNING ] ${NC}$1"
}

function echoError {
	echo -e "${RED}[ ERROR ] ${NC}$1"
}

function echoSuccess {
    echo -e "${GREEN}[ INFO ] ${NC}$1"
}
