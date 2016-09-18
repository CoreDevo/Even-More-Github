if [ $# -ne 1 ]; then
    echo "Usage ./start-server.sh <token>"
    exit 1
fi

program=
if [ `which nodejs` ]; then
    program="nodejs"
elif [ `which node` ]; then
    program="node"
else
    echo "please install node or nodejs "
    exit 1
fi

token=$1
echo "var token='${token}';" > src/js/token.js
echo "if(module) module.exports=token;"> src/js/token.js
$program app.js

