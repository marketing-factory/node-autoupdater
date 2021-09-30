mkdir /tmp/overlay
mount -t tmpfs tmpfs /tmp/overlay
mkdir /tmp/overlay/upper /tmp/overlay/workdir
mkdir /tmp/merged

mount -t overlay overlay -o \
lowerdir=/app,\
upperdir=/tmp/overlay/upper/,\
workdir=/tmp/overlay/workdir/ /tmp/merged/ 

#autoupdate /tmp/merged

echo pwd
pwd
echo ===========
echo ls
ls
echo ===========
echo ls /app
ls -la /app/
echo ===========
echo ls /tmp/merged
ls -la /tmp/merged/