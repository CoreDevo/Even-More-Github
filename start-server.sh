if [ $# -ne 1 ]; then
    echo "Usage ./start-server.sh <token>"
    exit 1
fi

if [ ! `which nodejs` ]; then
    echo "nodejs needed, but not found, set in PATH?"
fi
token=$1
echo "var token=${token}" > src/js/token.js
nodejs app.js
