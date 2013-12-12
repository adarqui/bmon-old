# qbw in bash, for kata project -- adarqui
#!/bin/bash

DEVS=$@
PIPE=""
CNT=0
DIV="/ 1024 / 1024"
DIV_DESC="mbit/s"
TIMEOUT=1

	declare -A INTERFACE_RX
	declare -A INTERFACE_TX
	declare -A INTERFACES
 
	if [ "$1" = "all" ] || [ "$1" = "any" ] ; then
		DEVS=`egrep -v "face|Inter" /proc/net/dev | awk -F: '{print $1}'`
	fi

	for i in $DEVS; do
		case $i in
			"-bps" | "-bit/s") DIV=""; DIV_DESC="bit/s";;
			"-kbps" | "-kbit/s") DIV=" / 1024"; DIV_DESC="kbit/s";;
			"-mbps" | "-mbit/s") DIV=" / 1024 / 1024"; DIV_DESC="mbit/s";;
			* ) ;;
		esac

		eval INTERFACE_RX["$i"]=0 INTERFACE_TX["$i"]=0;
		eval INTERFACES["$i"]=$i;
	done

	while getopts i:t:bkm flag; do
		case $flag in
			i)
				TIMEOUT=$OPTARG;;
			t)
				TIMEOUT=$OPTARG;;
			b)
				DIV=""; DIV_DESC="byte/s";;	
			k)
				DIV="/ 1024"; DIV_DESC="kbit/s";;
			m)
				DIV="/ 1024 / 1024"; DIV_DESC="mbit/s";;
			?)
				echo "?";;
		esac
	done

	#echo "MONITORING: [ `echo $DEVS|tr ' ' ','` ]"
	echo "MONITORING: [ ${INTERFACES[*]} ], TIMEOUT: $TIMEOUT, MODE: $DIV_DESC"

	for i in $DEVS; do export PIPE=$PIPE"$i|"; done
	PIPE=$PIPE"xxx"

	SKIP=0
	while true; do

		CNT=$(($CNT+1))

		while read line; do 
		
			LINE=$line
			LINE_if=`echo "$LINE" | awk -F: '{print \$1}'`

			#echo "[ $LINE_if ]"

			if [ -z "$LINE_if" ] ; then
				continue;
			fi

			if [ -z ${INTERFACES["$LINE_if"]} ] ; then
				continue;
			fi

			LINE_rx=`echo "$LINE" | awk -F: '{print \$2}'| awk '{print \$1}'`
			LINE_tx=`echo "$LINE" | awk -F: '{print \$2}'| awk '{print \$9}'`
			
			RES_rx=`expr $LINE_rx - ${INTERFACE_RX["$LINE_if"]}`
			RES_tx=`expr $LINE_tx - ${INTERFACE_TX["$LINE_if"]}`

			if [ "${INTERFACE_RX[$LINE_if]}" = "0" ] ; then
				SKIP=1
			fi

			INTERFACE_RX["$LINE_if"]="$LINE_rx";
			INTERFACE_TX["$LINE_if"]="$LINE_tx";

			bw_rx=$(echo "scale=2; $RES_rx $DIV" | bc)
			bw_tx=$(echo "scale=2; $RES_tx $DIV" | bc)

			if [ "$bw_rx" = "0" ] && [ "$bw_tx" = "0" ]; then
				continue
			fi

			if [ $SKIP -eq 1 ] ; then
				SKIP=0
				continue
			fi

			echo $CNT `date` : $LINE_if rx=$bw_rx $DIV_DESC tx=$bw_tx $DIV_DESC;

		done < '/proc/net/dev'


		sleep $TIMEOUT

	done
