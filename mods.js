let mods = (main)=>{
    let mapMap=main.mapMap();
    let STATUS=main.STATUS();
    console.log(mapMap,STATUS);

    function roomArrange(shuffle=true){
        if(shuffle){
            console.log('打乱房间');
            for(let i=1;i<=mapMap.Locs.length;i++){
                let des=Math.floor(main.RANDOM()*i)+1;
                let Loc0=mapMap.Locs.find((ele)=>ele.id==i);
                let Loc1=mapMap.Locs.find((ele)=>ele.id==des);
                //console.log(Loc0,Loc1);
                main.swapRom(Loc0,Loc1);
            }
        }
        else{
            mapMap.Locs.forEach((loc) => {
                loc.rom=loc.id;
            });
        }
        console.log('已分配房间', mapMap);
    }

    function openSpaceGate(){
        let spgt=mapMap.items.find((item)=>item.name=="出口"&&item.ty=="Rom"&&item.val==44);
        if(!spgt){
            let bc=main.getbc("spacegate");
            main.broadcast(bc);
            main.addItems([{
                "Rom":44,
                "name":"出口",
                "color":9,
            }]);
            updateStage(3);
        }
    }

    function updateStage(stage){
        if(mapMap.Round<=-1&&stage>=2)return;
        if(stage<=mapMap.ModsData.stage)return;
        mapMap.ModsData.stage=stage;
        let bc=main.getbc("stage"+stage);
        let hasbll=false;
        mapMap.Players.forEach((player)=>{
            if(player.character=="布莉萝")hasbll=true;
        });
        let hs=mapMap.ModsData.stagesteps["黑影"][stage];
        let ps=mapMap.ModsData.stagesteps["玩家"][stage];
        let bs=mapMap.ModsData.stagesteps["布莉萝"][stage];
        bc=bc.replace("[hs]",hs);
        bc=bc.replace("[ps]",ps==bs?`${ps}`:`${ps} 和 ${bs}`);
        bc=bc.replace("[player]",hasbll?"玩家和布莉萝":"玩家");
        main.broadcast(bc);
        Object.keys(mapMap.ModsData.stagesteps).forEach((key)=>{
            let val=mapMap.ModsData.stagesteps[key][stage];
            mapMap.Players.forEach((player)=>{
                if(player.character==key){
                    player.steps=val;
                }
            });
        });
    }

    function cubeturn(){
        let floor3=mapMap.floors.find((ele)=>ele.id==3);
        let cent3x=floor3.x+floor3.w/2;
        let cent3y=floor3.y+floor3.h/2;
        mapMap.Locs.forEach((Loc)=>{
            if(Loc.floor==3){
                Loc.center=[2*cent3x-Loc.center[0],2*cent3y-Loc.center[1]];
                Loc.vertices.forEach((vert)=>{
                    vert[0]=2*cent3x-vert[0];
                    vert[1]=2*cent3y-vert[1];
                })
            }
            let floor4=mapMap.floors.find((ele)=>ele.id==4);
            let cent4x=floor4.x+floor4.w/2;
            let cent4y=floor4.y+floor4.h/2;
            if(Loc.floor==4){
                Loc.center=[2*cent4x-Loc.center[0],2*cent4y-Loc.center[1]];
                Loc.vertices.forEach((vert)=>{
                    vert[0]=2*cent4x-vert[0];
                    vert[1]=2*cent4y-vert[1];
                })
            }
        });
        let arr=[0,1,1,2,2,3,3];
        let brr=[];
        mapMap.Doors.forEach((door)=>{
            if(door.type=="portal")return;
            let Loc1=mapMap.Locs.find(Loc=>Loc.id==door.Loc1);
            let Loc2=mapMap.Locs.find(Loc=>Loc.id==door.Loc2);
            if(arr[Loc1.floor]!=arr[Loc2.floor]){
                brr.push(door);
            }
        });
        console.log(brr);
        mapMap.Doors=mapMap.Doors.filter((ele)=>!brr.find((ele1)=>ele1==ele));
        if(!mapMap.ModsData.doorstorecover)mapMap.ModsData.doorstorecover=[
            {"Loc1":9,"Loc2":22,"type":"stair"},
            {"Loc1":30,"Loc2":31,"type":"stair"}
        ];
        mapMap.Doors=mapMap.Doors.concat(mapMap.ModsData.doorstorecover);
        mapMap.ModsData.doorstorecover=brr;
    }
    
    return [
        {
            "name":"随机鲨0.3",
            broadcasts:{
                "dead": "【旅馆广播】【[player]】死亡。\"1\"",
                "deadhy": "【旅馆广播】黑影死亡，即将在 [三楼·301] 重生。\"4\"",
                "exitloc": "【旅馆广播】[loc]：大堂。\"5\"",
                "stage1": "【旅馆广播】游戏进入第一阶段，黑影每回合可行动至多 [hs] 步，[player]每回合可行动至多 [ps] 步。\"4\"",
                "stage2": "【旅馆广播】游戏进入第二阶段，黑影每回合可行动至多 [hs] 步，[player]每回合可行动至多 [ps] 步。\"8\"",
                "stage3": "【旅馆广播】游戏进入第三阶段，黑影每回合可行动至多 [hs] 步，[player]每回合可行动至多 [ps] 步。\"9\"",
                "cubereset": "【旅馆广播】魔方旋转，当前魔方旅馆的状态为：复原；电梯将启用，请注意魔方结构的变化。\"4\"",
                "cubeturn": "【旅馆广播】魔方旋转，当前魔方旅馆的状态为：旋转；电梯将禁用，请注意魔方结构的变化。\"1\"",
                "switchon": "【旅馆广播】电力机关状态改变，[一楼·更衣室] 处于通电状态。\"2\"",
                "switchoff": "【旅馆广播】电力机关状态改变，[一楼·更衣室] 处于断电状态。\"3\"",
                "gas": "【旅馆广播】[四楼·402]变为毒气室。\"4\"",
                "keyget": "【旅馆广播】有开锁器被发现。\"4\"",
                "keykick": "【旅馆广播】有开锁器被踢走。\"1\"",
                "gunshot": "【旅馆广播】[Floor]楼传来一声震耳欲聋的枪声……\"6\"",
                "diamond": "【旅馆广播】【能量源】被取走，当前房间：[[rom]]。\"5\"",
                "awake": "【旅馆广播】[Rom] 和 [五楼·密室] 间的通道已开启。\"5\"",
                "poker": "【旅馆广播】[Loc1] 和 [Loc2] 间的通道已开启。\"5\"",
                "round":"【旅馆广播】R[end]结束，R[begin]开始，请[char]行动。“[color]”",
                "reset": "【旅馆广播】请注意，研究室遭到破坏，需要修复，系统将在一分钟后重启……\"0\"",
                "spacegate": "【旅馆广播】空间隧道开启。\"9\""
            },
            list:[
                {   
                    name:"更衣室",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":29,"color":9,"name":"电门","type":"机关"},{"Rom":1,"color":2,"name":"有电"},{"Rom":24,"color":7,"name":"靴子"}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="有电"||item.name=="没电"),
                        src:"n2rom1.svg"
                    },
                    icon_2:{
                        cond:item=>(item.name=="电门"),
                        src:"n2rom29.svg"
                    },
                    mechan:{
                        cond:(item)=>item.name=='电门',
                        result:(item)=>{
                            if(item.used){
                                updateStage(2);
                                //console.log('电门被操作。');
                                let item0=mapMap.items.find((item)=>item.name=="有电"||item.name=="没电");
                                if(!item0)return;
                                if(item0.name=="有电"){
                                    main.broadcast(main.getbc("switchoff"));
                                    item0.color=mapMap.COLOR_DEFAULT[3];
                                    item0.name='没电';
                                }
                                else if(item0.name=="没电"){
                                    main.broadcast(main.getbc("switchon"));
                                    item0.color=mapMap.COLOR_DEFAULT[2];
                                    item0.name='有电';
                                }
                            }
                        }
                    },
                    item:{
                        cond:(item)=>item.name=="有电"||item.name=="没电",
                        info:(item)=>{
                            let info=document.getElementById('info');
                            if(item.name=="没电")info.innerHTML=`更衣室处于断电状态。受电门机关控制。再点一次也可以打开。`;
                            else info.innerHTML= `更衣室处于通电状态。受电门机关控制。再点一次也可以关闭。`;
                        },
                        click:(item)=>{
                            console.log(mapMap);
                            console.log(main);
                            if(item.name=="有电"){
                                main.broadcast(main.getbc("switchoff"));
                                item.color=mapMap.COLOR_DEFAULT[3];
                                item.name='没电';
                            }
                            else if(item.name=="没电"){
                                main.broadcast(main.getbc("switchon"));
                                item.color=mapMap.COLOR_DEFAULT[2];
                                item.name='有电';
                            }
                        }
                    }
                },
                {
                    name:"小熊",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":26,"color":6,"name":"小熊"}]);
                        }
                    },
                    item:{
                        cond:(item)=>item.name=="小熊",
                        info_additional:(item)=>{
                            main.getButton(tinycolor.mix(item.color,"#fff",50),"使用",()=>{
                                main.deleteItem(item);
                                main.setDoor();
                                main.jumpAccordSTATUS();
                            });
                        }
                    }
                },
                {
                    name:"霰弹枪与毒气",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":25,"color":3,"name":"没毒"},{"Rom":27,"color":6,"name":"霰弹"},{"Rom":42,"color":7,"name":"口罩"}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="有毒"||item.name=="没毒"),
                        src:"n2rom25.svg"
                    },
                    item:{
                        cond:(item)=>item.name=='霰弹',
                        info_additional:(item)=>{
                            main.getButton(tinycolor.mix(item.color,"#fff",50),"开枪",()=>{
                                let name=prompt("击毙谁？");
                                let pla=mapMap.Players.find((ele)=>ele.name==name);
                                if(!pla)return;
                                main.killPlayer(pla);
                                let bc=main.getbc("gunshot");
                                let Loc=main.getItemActual(item,"Loc");
                                bc=bc.replaceAll("[Floor]",mapMap.Locs.find((ele)=>ele.id==Loc).floor);
                                main.broadcast(bc);
                                main.jumpAccordSTATUS();
                            });
                        },
                        result:(item)=>{
                            if(item.ty!="Rom"||(item.ty=="Rom"&&item.val!=27)){
                                let item0=mapMap.items.find((item)=>item.name=="没毒");
                                if(!item0)return;
                                item0.name='有毒';
                                item0.color=mapMap.COLOR_DEFAULT[4];
                                let bc=main.getbc("gas");
                                main.broadcast(bc);
                            }
                        }
                    },
                    item_2:{
                        cond:(item)=>item.name=="毒气"||item.name=="没毒",
                        info:(item)=>{
                            let info=document.getElementById('info');
                            info.innerHTML=(()=>{
                                if(item.name=="没毒")return `402正常。受霰弹枪控制。再点一次也可以打开。`;
                                else return `402已变为毒气室。受霰弹枪控制。再点一次也可以关闭。`;
                            })();
                        },
                        click:(item)=>{
                            if(item.name=="毒气"){
                                item.color=mapMap.COLOR_DEFAULT[3];
                                item.name='没毒';
                            }
                            else if(item.name=="没毒"){
                                main.broadcast(main.getbc("gas"));
                                item.color=mapMap.COLOR_DEFAULT[4];
                                item.name='毒气';
                            }
                        }
                    }
                },
                {
                    name:"觉醒机关",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":35,"color":9,"name":"觉醒","type":"机关"}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="觉醒"),
                        src:"n2rom35.svg"
                    },
                    mechan:{
                        cond:(item)=>item.name=='觉醒',
                        click_additional:(item)=>{
                            let str=prompt("请输入目标房间。留空默认为东餐。");
                            let li=main.getLoc(main.getLocorRom(str));
                            li=li||11;
                            mapMap.ModsData.awakedest=li;
                            let bc=main.getbc("awake");
                            bc=bc.replaceAll("[Rom]",`[${mapMap.Roms.find((ele)=>ele.id==li).name}]`);
                            main.broadcast(bc);
                        },
                        result:(item)=>{
                            if(item.used){
                                updateStage(2);
                                let dest=mapMap.ModsData.awakedest;
                                if(!dest)dest=11;
                                if(!main.getPortal(35,dest)){
                                    mapMap.Doors.push({
                                        Rom1:35,
                                        Rom2:dest,
                                        type:"portal",
                                        isExtra:true
                                    });
                                }
                            }
                        }
                    }
                },
                {
                    name:"扑克机关",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":33,"color":9,"name":"扑克","type":"机关"}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="扑克"),
                        src:"n2rom33.svg"
                    },
                    mechan:{
                        cond:(item)=>item.name=='扑克',
                        click_additional:(item)=>{
                            let str=prompt("请输入一对目标位置。留空默认为 9 和 10。");
                            let sli=str.split(" ");
                            mapMap.ModsData.pokerdest=[9,10];
                            if(sli.length==2){
                                let l1=main.getLoc(main.getLocorRom(sli[0]));
                                let l2=main.getLoc(main.getLocorRom(sli[1]));
                                if(l1&&l2){
                                    mapMap.ModsData.pokerdest=[l1,l2];
                                }
                            }
                            let bc=main.getbc("poker");
                            bc=bc.replaceAll("[Loc1]",mapMap.ModsData.pokerdest[0]);
                            bc=bc.replaceAll("[Loc2]",mapMap.ModsData.pokerdest[1]);
                            main.broadcast(bc);
                        },
                        result:(item)=>{
                            if(item.used){
                                updateStage(2);
                                let [a,b]=mapMap.ModsData.pokerdest;
                                if(!main.getDoor(a,b)){
                                    mapMap.Doors.push({
                                        Loc1:a,
                                        Loc2:b,
                                        isExtra:true
                                    })
                                }
                            }
                        }
                    }
                },
                {
                    name:"能量源",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":3,"color":9,"name":"壁炉","type":"机关"}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="壁炉"),
                        src:"n2rom3.svg"
                    },
                    mechan:{
                        cond:(item)=>item.name=='壁炉',
                        click_additional:(item)=>{
                            main.addItems([{
                                "name":'钻石',
                                "Rom":3,
                                "color":5,
                                "static":true
                            }]);
                        },
                        result:(item)=>{
                            if(item.used){
                                updateStage(2);
                            }
                        }
                    },
                    item:{
                        cond:(item)=>item.name=='钻石',
                        result:(item)=>{
                            let rom0=mapMap.Roms.find((ele)=>ele.id==main.getItemActual(item,"Rom"));
                            if(rom0.name=="六楼·研究室"){
                                main.deleteItem(item);
                                openSpaceGate();
                            }
                            else if(rom0.name!="一楼·休息室"){
                                let bc=main.getbc("diamond");
                                bc=bc.replace("[rom]",rom0.name);
                                main.broadcast(bc);
                            }
                        }
                    }
                },
                {
                    name:"麦克风",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":19,"color":9,"name":"麦克","type":"机关"}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="麦克"),
                        src:"n2rom19.svg"
                    },
                    mechan:{
                        cond:(item)=>item.name=='麦克',
                        click:(item)=>{
                            const existing = document.getElementById('broadcastPopupOverlay');
                            if (existing) existing.remove();

                            const overlay = document.createElement('div');
                            overlay.id = 'broadcastPopupOverlay';
                            overlay.className = 'popup-overlay';

                            const popup = document.createElement('div');
                            popup.className = 'popup-container';

                            const header = document.createElement('div');
                            header.className = 'popup-header';

                            const contentDiv = document.createElement('div');
                            contentDiv.className = 'broadcasts';

                            let divsend=main.getbcdiv("【旅馆广播】请输入文本",(text,div)=>(()=>{
                                let str=text.innerText;
                                let color0=null;
                                [color0,str]=main.parseTextWithColor(str);
                                console.log(color0,str);
                                if(color0)text.style.color=color0;
                            }));

                            contentDiv.appendChild(divsend);

                            let sbutton=document.createElement('button');
                            sbutton.innerText="发送";
                            sbutton.addEventListener('click',()=>{
                                let wenben=divsend.querySelector('.bcwenben').innerText;
                                if(STATUS.ty!="normal")wenben=wenben+`（来自${STATUS.val.name}）`;
                                main.broadcast(wenben);
                                overlay.remove();
                            })
                            contentDiv.appendChild(sbutton);

                            Object.keys(mapMap.broadcasts).forEach(key => {
                                let wenben=mapMap.broadcasts[key];
                                let div=main.getbcdiv(wenben,(text,div)=>(()=>{
                                    let str=text.innerText;
                                    if(!str.trim()){
                                        text.innerText=mapMap.broadcasts[key];
                                        return;
                                    }
                                    mapMap.broadcasts[key]=str;
                                    let color0=null;
                                    [color0,str]=main.parseTextWithColor(str);
                                    if(color0)text.style.color=color0;
                                }),false);
                                contentDiv.appendChild(div);
                            });

                            let title = document.createElement('text');
                            title.innerText = '可以发送广播，也可以修改全局广播内容。';
                            title.style.color = '#fff';

                            header.appendChild(title);
                            popup.appendChild(header);
                            popup.appendChild(contentDiv);

                            let buttonDiv = document.createElement('div');
                            buttonDiv.className = 'popup-buttons';

                            const closeButton = document.createElement('button');
                            closeButton.innerText = '返回';
                            closeButton.setAttribute("id","closeButton");
                            closeButton.addEventListener('click', () => {
                                overlay.remove();
                            });
                            buttonDiv.appendChild(closeButton);

                            popup.appendChild(buttonDiv);

                            overlay.appendChild(popup);
                            document.body.appendChild(overlay);

                            console.log(overlay);
                        }
                    },
                },
                {
                    name:"魔方机关",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":18,"color":9,"name":"魔方","type":"机关"}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=='魔方'),
                        src:"n2rom18.svg"
                    },
                    mechan:{
                        cond:(item)=>item.name=='魔方',
                        result:(item)=>{
                            if(item.used){
                                updateStage(2);
                                if(!mapMap.ModsData.cube){
                                    mapMap.ModsData.cube="turned";
                                    main.broadcast(main.getbc("cubeturn"));
                                }
                                else{
                                    mapMap.ModsData.cube=null;
                                    main.broadcast(main.getbc("cubereset"));
                                }
                                cubeturn();
                            }
                        }
                    }
                },
                {
                    name:"四北",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":24,"color":8,"name":"黑暗"},{"Rom":4,"color":6,"name":"手电"},]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="黑暗"),
                        src:"n2rom24.svg"
                    },
                    item:{
                        cond:(item)=>item.name=='黑暗'||item.name=='明亮',
                        info:(item)=>{
                            let info=document.getElementById('info');
                            if(item.name=="黑暗")info.innerHTML= `再点一次变为明亮。`;
                            else info.innerHTML= `再点一次变为黑暗。`;
                        },
                        click:(item)=>{
                            if(item.name=="黑暗"){
                                item.color=mapMap.COLOR_DEFAULT[2];
                                item.name='明亮';
                                main.jumpAccordSTATUS();
                            }
                            else if(item.name=="明亮"){
                                item.color=mapMap.COLOR_DEFAULT[8];
                                item.name='黑暗';
                                main.jumpAccordSTATUS();
                            }
                        },
                        result:(item)=>{
                            if(item.name=="黑暗"){
                                let Loc0=mapMap.Locs.find(Loc=>Loc.id==main.getLoc(item));
                                if(!Loc0)return;
                                Loc0.visPlayer=[];
                                let lis0=[];
                                mapMap.Locs.forEach(Loc=>{
                                    if(!Loc.visPlayer.length){
                                        lis0.push(Loc);
                                    }
                                })
                                if(!lis0.length)return;
                                let randomloc=lis0[Math.floor(main.RANDOM()*lis0.length)];
                                main.swapRom(Loc0,randomloc);
                            }
                        },
                    },
                    stepend:{
                            priority:1,
                            fun:()=>{
                                let isDark=new Map();
                                mapMap.items.forEach((item)=>{
                                    if(item.name=="黑暗"){
                                        if(item.ty!="Player")isDark[main.getLoc({ty:item.ty,val:item.val})]=true;
                                    }
                                })
                                //console.log(isDark);
                                mapMap.items.forEach((item)=>{
                                    if(item.name=="黑暗")return;
                                    if(item.ty!="Player"){
                                        if(isDark[main.getLoc({ty:item.ty,val:item.val})]){
                                            //console.log(item);
                                            if(!Object.prototype.hasOwnProperty.call(item,"invisible"))item.invisible="黑暗";
                                        }
                                        else{
                                            if(item.invisible=="黑暗")Reflect.deleteProperty(item,"invisible");
                                        }
                                    }
                                })
                            }
                        },
                },
                ((Name)=>{mapMap.ModsConfig[Name]={};let src=()=>mapMap.ModsConfig[Name];return {
                    name:Name,
                    config:(dom)=>{
                        let str="在 R[round:-1] 结束时共生成 [keycount:3] 个开锁器，要求距离编号为 [exit:7] 的房间超过 [stp:3] 步。"
                        main.defaultConfig(dom,str,src());
                    },
                    roundend:{
                        priority:100000000,
                        fun:()=>{
                            if(mapMap.Round!=src().round)return;
                            let lis=[];
                            for(let iii=1;iii<=src().keycount;iii++){
                                let Loc7=mapMap.Locs.find(Loc=>Loc.rom==src().exit).id;
                                let dis=main.caculateDis(Loc7);
                                let ge3=[];
                                mapMap.Locs.forEach((ele)=>{
                                    if(dis.get(ele.id)===null||dis.get(ele.id)>src().stp)ge3.push(ele.rom);
                                });
                                let rom0=ge3.length?ge3[Math.floor(main.RANDOM()*ge3.length)]:1;
                                lis.push({"Rom":rom0,"color":4,"name":"开锁","static":true});
                            }
                            main.addItems(lis);
                        }
                    },
                    item:{
                        cond:(item)=>item.name=='开锁',
                        info:(item)=>{
                            let info=document.getElementById('info');
                            info.innerHTML=(()=>{
                                if(item.ty=='Player'){
                                    return `${item.name}。再点一次以丢弃。`
                                }
                                else{
                                    let posiInfo='';
                                    if(item.ty=='Rom'){
                                        posiInfo=`位于${mapMap.Roms.find((ele)=>ele.id==item.val).name}。`;
                                    }
                                    else if(item.ty=='Loc'){
                                        posiInfo=`位于${item.val}。`;
                                    }
                                    if(STATUS.ty=='move'||STATUS.ty=='round'){
                                        if(STATUS.val.character=="黑影"){
                                            return `${item.name}。${posiInfo}再点一次以踢走。`;
                                        }
                                        return `${item.name}。${posiInfo}再点一次以拾取。`;
                                    }
                                    else{
                                        return `${item.name}。${posiInfo}再点一次以删除。`
                                    }
                                }
                            })();
                        },
                        click:(item)=>{
                            if(item.ty=='Player'){
                                main.dropItem(item,mapMap.Players.find(player=>player.id==item.val));
                            }
                            else{
                                if(STATUS.ty=='move'||STATUS.ty=='round'){
                                    if(STATUS.val.character=="黑影"){
                                        let bc0=main.getbc("keykick");
                                        main.broadcast(bc0);
                                        main.moveItem(item);
                                    }
                                    else{
                                        let bc0=main.getbc("keyget");
                                        main.broadcast(bc0);
                                        main.pickItem(item,STATUS.val);
                                    }
                                }
                                else{
                                    main.deleteItem(item);
                                }
                            }
                        }
                    }
                }})("开锁器"),
                {
                    name:"死歌",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([{"Rom":36,"color":7,"name":"十字","static":true,"keepInventory":true}]);
                            main.addItems([{"Rom":36,"color":1,"name":"死歌","alwaysInvisible":true}]);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="死歌"),
                        src:"n2rom36.svg"
                    },
                    item:{
                        cond:(item)=>item.name=='十字',
                        result:(item)=>{
                            //console.log("???");
                            if(item.ty!="Rom"){
                                updateStage(2);
                            }
                        }
                    }
                },
                {
                    name:"其他道具和图标（金币望远变装大堂档案室连廊301）",
                    init:{
                        priority:0,
                        fun:()=>{
                            main.addItems([
                                {"Rom":16,"color":2,"name":"金币"},
                                {"Rom":17,"color":4,"name":"望远"},
                                {"Rom":23,"color":7,"name":"变装"},
                                {"Rom":7,"color":8,"name":"大堂","alwaysInvisible":true},
                                {"Rom":47,"color":8,"name":"档案室","alwaysInvisible":true},
                                {"Rom":14,"color":8,"name":"301","alwaysInvisible":true},
                                {"Rom":49,"color":8,"name":"连廊","alwaysInvisible":true}
                            ]);
                        }
                    },
                    icon_1:{
                        cond:item=>(item.name=="大堂"),
                        src:"n2rom7.svg"
                    },
                    icon_2:{
                        cond:item=>(item.name=="档案室"),
                        src:"n2rom47.svg"
                    },
                    icon_3:{
                        cond:item=>(item.name=="301"),
                        src:"n2rom14.svg"
                    },
                    icon_4:{
                        cond:item=>(item.name=="连廊"),
                        src:"n2rom49.svg"
                    }
                },
                ((Name)=>{mapMap.ModsConfig[Name]={};let src=()=>mapMap.ModsConfig[Name];return {
                    name:Name,
                    config:(dom)=>{
                    },
                    init:{
                        priority:100,
                        fun:()=>{
                            const existing = document.getElementById('broadcastPopupOverlay');
                            if (existing) existing.remove();

                            const overlay = document.createElement('div');
                            overlay.id = 'broadcastPopupOverlay';
                            overlay.className = 'popup-overlay';

                            const popup = document.createElement('div');
                            popup.className = 'popup-container';

                            const header = document.createElement('div');
                            header.className = 'popup-header';

                            const contentDiv = document.createElement('div');
                            contentDiv.className = 'content';

                            let title = document.createElement('text');
                            title.innerText = '优先级已排好，请设定身份：';
                            title.style.color = '#fff';

                            mapMap.Players.forEach((player,index)=>{
                                let div=document.createElement('div');
                                div.className="player";
                                div.style.display="inline-block";
                                div.style.marginRight="7px";
                                let name=main.getbcdiv(`${player.name} “${player.color}”`,(text,div)=>(()=>{
                                    let str=text.innerText;
                                    if(!str.trim()){
                                        text.innerText=player.name;
                                        return;
                                    }
                                    player.name=str;
                                }));
                                let chara=main.getbcdiv(`${player.character} “${player.color}”`,(text,div)=>(()=>{
                                    let str=text.innerText;
                                    if(!str.trim()){
                                        text.innerText=player.character;
                                        return;
                                    }
                                    player.character=str;
                                }));
                                chara.style.display="table";
                                chara.style.margin="0 auto";
                                div.appendChild(name);
                                div.appendChild(chara);
                                contentDiv.appendChild(div);
                            });

                            mapMap.ModsData.stage=0;

                            mapMap.ModsData.stagesteps={
                                "玩家":[0,2,3,4],
                                "布莉萝":[0,2,3,4],
                                "黑影":[0,3,5,7],
                            }

                            mapMap.ModsData.stagesep=[-1,5,9];

                            let csdiv=document.createElement('div');

                            Object.keys(mapMap.ModsData.stagesteps).forEach((key)=>{
                                let div=document.createElement('div');
                                div.style.display="flex";
                                let charname=document.createElement('text');
                                charname.innerText=`${key}步数：`;
                                charname.style.color="#fff";
                                let des=mapMap.ModsData.stagesteps[key];
                                let stp=main.getbcdiv(`${des.slice(1,4).join(" ")} “#fff”`,(text)=>(()=>{
                                    let str=text.innerText;
                                    if(!str.trim()||str.trim().split(" ").length!=3){
                                        text.innerText=des.slice(1,4).join(" ");
                                        return;
                                    }
                                    mapMap.ModsData.stagesteps[key]=[0].concat(str.trim().split(" ").map(Number));
                                }));
                                div.appendChild(charname);
                                div.appendChild(stp);
                                contentDiv.appendChild(div);
                            });
                            {
                                let div=document.createElement('div');
                                div.style.display="flex";
                                let cn=document.createElement('text');
                                cn.innerText=`以下回合结束时转阶段：`;
                                cn.style.color=main.parseColor("4");
                                let des=mapMap.ModsData.stagesep;
                                let stp=main.getbcdiv(`${des.join(" ")} “4”`,(text)=>(()=>{
                                    let str=text.innerText;
                                    if(!str.trim()||str.trim().split(" ").length!=3){
                                        text.innerText=des.join(" ");
                                        return;
                                    }
                                    mapMap.ModsData.stagesep=str.trim().split(" ").map(Number);
                                    console.log(mapMap.ModsData.stagesep);
                                }));
                                div.appendChild(cn);
                                div.appendChild(stp);
                                contentDiv.appendChild(div);
                            }

                            header.appendChild(title);
                            popup.appendChild(header);
                            popup.appendChild(contentDiv);

                            let buttonDiv = document.createElement('div');
                            buttonDiv.className = 'popup-buttons';

                            const closeButton = document.createElement('button');
                            closeButton.innerText = '完成';
                            closeButton.setAttribute("id","closeButton");
                            closeButton.addEventListener('click', () => {
                                mapMap.Players.forEach((player)=>{
                                    if(player.character=="布莉萝"){
                                        let rom0=Math.floor(main.RANDOM()*mapMap.Locs.length)+1;
                                        main.addItems([{
                                            "name":'集邮',
                                            "Rom":rom0,
                                            "color":5,
                                            "static":true
                                        }]);
                                    }
                                    if(player.character=="黑影"){
                                        main.addItems([{
                                            "name":'手枪',
                                            "Player":player.id,
                                            "keepInventory":true,
                                            "color":1,
                                            "static":true
                                        }]);
                                    }
                                })
                                overlay.remove();
                                main.jumpAccordSTATUS();
                            });
                            buttonDiv.appendChild(closeButton);

                            popup.appendChild(buttonDiv);

                            overlay.appendChild(popup);
                            document.body.appendChild(overlay);

                            console.log(overlay);
                        }
                    },
                    roundend:{
                        priority:1000000,
                        fun:()=>{
                            mapMap.ModsData.stagesep.forEach((sep,index)=>{
                                if(mapMap.Round>=sep)updateStage(index+1);
                            })
                            let placnt=0;
                            mapMap.Players.forEach((player)=>{
                                if(player.character=="玩家"&&(!player.dead||player.fakedead)){
                                    placnt++;
                                }
                                if(player.character=="黑影"&&player.dead){
                                    player.dead=false;
                                    player.Loc=mapMap.Locs.find(Loc=>Loc.rom==14).id||player.Loc;
                                }
                            });
                            console.log(placnt);
                            if(placnt<=1){
                                openSpaceGate();
                            }
                        }
                    }
                }})("身份与阶段"),
                ((Name)=>{mapMap.ModsConfig[Name]={};let src=()=>mapMap.ModsConfig[Name];return {
                    name:Name,
                    config:(dom)=>{
                        let str="系统重启时，所有人随机得知 [a:0]+[b:2]X 个位置的房间。（X为回合数）"
                        main.defaultConfig(dom,str,src());
                    },
                    init:{
                        priority:1,
                        fun:()=>{
                            main.addItems([{"Rom":44,"color":9,"name":"重启","type":"机关","static":true}]);
                            let itemstorecover=[];
                            mapMap.items.forEach((item)=>{
                                if(!item.static)itemstorecover.push(item);
                            });
                            mapMap.ModsData.itemstorecover=JSON.stringify(itemstorecover);
                        }
                    },
                    icon:{
                        cond:item=>(item.name=="重启"),
                        src:"n2rom44.svg"
                    },
                    mechan:{
                        cond:(item)=>item.name=='重启',
                        click:(item)=>{
                            if(STATUS.ty!="normal"&&(!item.used||item.used=="主持")){
                                STATUS.val.stpData.push({"ty":"Mechan","val":item.name});
                                main.killPlayer(STATUS.val);
                                main.switchNormalMode();
                            }
                            else if(STATUS.ty=="normal"&&!item.used){
                                item.used="主持";
                            }
                            else if(STATUS.ty=="normal"&&item.used){
                                item.used=null;
                            }
                        },
                        result:(item)=>{
                            if(item.used){
                                main.broadcast(main.getbc("reset"));
                                if(mapMap.ModsData.cube){
                                    mapMap.ModsData.cube=null;
                                    cubeturn();
                                }
                                mapMap.Doors.forEach((door)=>{
                                    if(door.disabled)door.disabled=false;
                                });
                                mapMap.Doors=mapMap.Doors.filter((door)=>!door.isExtra);
                                let itemtodelete=[];
                                mapMap.items.forEach((item)=>{
                                    if(!item.static){
                                        //console.log(item);
                                        itemtodelete.push(item);
                                    }
                                });
                                itemtodelete.forEach((item)=>{
                                    main.deleteItem(item);
                                });
                                let itemtoadd=[];
                                mapMap.itemsDefault.forEach((item)=>{
                                    if(!item.static){
                                        itemtoadd.push(item);
                                    }
                                })
                                main.addItems(JSON.parse(mapMap.ModsData.itemstorecover));
                                console.log(mapMap);
                                roomArrange();
                                mapMap.Locs.forEach((Loc)=>{
                                    if(Loc.visPlayer.length)Loc.visPlayer=[];
                                });
                                mapMap.Players.forEach((player)=>{
                                    let lim=Math.min(src().a+mapMap.Round*src().b,mapMap.Locs.length);
                                    let arr=[];if(player.dead&&player.character!="黑影")return;
                                    for(let i=1;i<=mapMap.Locs.length;i++)arr.push(i);
                                    arr.sort(()=>main.RANDOM()-0.5);
                                    for(let i=0;i<lim;i++){
                                        mapMap.Locs.find((ele)=>ele.id==arr[i]).visPlayer.push(player.id);
                                    }
                                });
                            }
                        }
                    }
                }})("系统重启"),
                ((Name)=>{mapMap.ModsConfig[Name]={};let src=()=>mapMap.ModsConfig[Name];return {
                    name:Name,
                    config:(dom)=>{
                        //main.defaultConfig(dom,`要使用 DATA 设定吗？(Y/N) [usedata:Y:string]`,src());
                    },
                    roundend:{
                        priority:10,
                        fun:()=>{
                            if(mapMap.Round>=0){
                                let bc=main.getbc("round");
                                bc=bc.replace("[end]",mapMap.Round);
                                bc=bc.replace("[begin]",mapMap.Round+1);
                                bc=bc.replace("[char]",["玩家","黑影"][mapMap.Round%2]);
                                bc=bc.replace("[color]",main.getRoundColor(mapMap.Round+1));
                                main.broadcast(bc);
                            }
                        }
                    }
                }})("回合广播"),
                ((Name)=>{mapMap.ModsConfig[Name]={};let src=()=>mapMap.ModsConfig[Name];return {
                    name:Name,
                    config:(dom)=>{
                    },
                    init:{
                        priority:1,
                        fun:()=>{
                            main.addItems([{"Rom":44,"color":'#ccc',"name":"打乱","type":"机关","static":true}]);
                        }
                    },
                    mechan:{
                        cond:(item)=>item.name=='打乱',
                        click:(item)=>{
                            if(STATUS.ty!="normal"&&(!item.used||item.used=="主持")){
                                STATUS.val.stpData.push({"ty":"Mechan","val":item.name});
                                main.killPlayer(STATUS.val);
                                main.switchNormalMode();
                            }
                            else if(STATUS.ty=="normal"&&!item.used){
                                item.used="主持";
                            }
                            else if(STATUS.ty=="normal"&&item.used){
                                item.used=null;
                            }
                        },
                        result:(item)=>{
                            if(item.used){
                                main.broadcast(main.getbc("reset"));
                                mapMap.items.forEach(item=>{
                                    if(main.RANDOM()<0.5){
                                        if(item.ty=='Loc'){
                                            item.ty='Rom';
                                            item.val=mapMap.Locs.find(ele=>ele.id==item.val).rom;
                                        }
                                        else if(item.ty=='Rom'){
                                            item.ty='Loc';
                                            item.val=mapMap.Locs.find(ele=>ele.rom==item.val).id;
                                        }
                                    }
                                })
                                console.log(mapMap);
                                let keploc=new Map();
                                mapMap.Players.forEach(ele=>{
                                    if(main.RANDOM()<0.5){
                                        keploc.set(ele.id,ele.Loc);
                                    }
                                })
                                console.log(keploc);
                                roomArrange();
                                mapMap.Locs.forEach((Loc)=>{
                                    if(Loc.visPlayer.length)Loc.visPlayer=Loc.visPlayer.filter(ele=>keploc.has(ele));
                                });
                                mapMap.Players.forEach((player)=>{
                                    if(player.dead&&player.character!="黑影")return;
                                    if(keploc.has(player.id)){
                                        player.Loc=keploc.get(player.id);
                                    }
                                    else{
                                        let lim=Math.min(mapMap.Round*2,mapMap.Locs.length);
                                        let arr=[];
                                        for(let i=1;i<=mapMap.Locs.length;i++)arr.push(i);
                                        arr.sort(()=>main.RANDOM()-0.5);
                                        for(let i=0;i<lim;i++){
                                            mapMap.Locs.find((ele)=>ele.id==arr[i]).visPlayer.push(player.id);
                                        }
                                    }
                                });
                            }
                        }
                    },
                    roundend:{
                        priority:10,
                        fun:()=>{
                            if(mapMap.Round>=-1){
                                let lis=[];
                                if(mapMap.Round%2==0){
                                    mapMap.Players.forEach((ele)=>{
                                        if(ele.dead)return;
                                        if(ele.character!="黑影"){
                                            if(main.RANDOM()<0.5)lis.push(ele.Loc);
                                            else lis.push(`[${mapMap.Roms.find((elee)=>elee.id==mapMap.Locs.find(eleee=>eleee.id==ele.Loc).rom).name}]`);
                                        }
                                    });
                                }
                                else if((mapMap.Round+100)%2==1){
                                    mapMap.Players.forEach((ele)=>{
                                        if(ele.dead)return;
                                        if(ele.character=="黑影"){
                                            if(main.RANDOM()<0.5)lis.push(ele.Loc);
                                            else lis.push(`[${mapMap.Roms.find((elee)=>elee.id==mapMap.Locs.find(eleee=>eleee.id==ele.Loc).rom).name}]`);
                                        }
                                    });
                                }
                                lis.sort((a,b)=>a.toString()<b.toString()?1:-1);
                                let bc=main.getbc("round");
                                bc=bc.replace("[end]",mapMap.Round);
                                bc=bc.replace("[begin]",mapMap.Round+1);
                                bc=bc.replace("[char]",`位于 ${lis.join(" ")} 的人`);
                                bc=bc.replace("[color]",main.getRoundColor(mapMap.Round+1));
                                main.broadcast(bc);
                            }
                        }
                    }
                }})("打乱房间"),
            ]
        },
        // {
        //     name:"否极泰来",
        //     notdefault:true,
        //     list:[
        //         {
        //             name:"否极泰来",
        //             init:{
        //                 priority:1000,
        //                 fun:()=>{
        //                     mapMap.Locs.forEach((Loc)=>{
        //                         Loc.vertices.forEach((v0)=>{
        //                             if(Loc.floor<=3)Loc.floor+=3;
        //                             else Loc.floor-=3;
        //                         })
        //                     });
        //                     mapMap.Doors.splice(mapMap.Doors.indexOf(main.getNotPortal(22,30)),1);
        //                     mapMap.Doors.splice(mapMap.Doors.indexOf(main.getNotPortal(15,24)),1);
        //                     mapMap.Doors.push({"Loc1":8,"Loc2":48});
        //                     mapMap.ModsData.doorstorecover=[
        //                         {"Loc1":8,"Loc2":9,"type":"stair"},
        //                         {"Loc1":31,"Loc2":48,"type":"stair"}
        //                     ];
        //                     main.initLocs();
        //                 }
        //             },
        //         }
        //     ]
        // },
        // {
        //     name:"DATA",
        //     notdefault:true,
        //     list:[
        //         {
        //             name:"DATA",
        //             roundend:{
        //                 priority:10,
        //                 fun:()=>{
        //                     if(mapMap.Round>=-1){
        //                         let lis=[];
        //                         if(mapMap.Round%2==0){
        //                             mapMap.Players.forEach((ele)=>{
        //                                 if(ele.dead)return;
        //                                 if(ele.character!="黑影"){
        //                                     lis.push(ele.Loc);
        //                                 }
        //                             });
        //                         }
        //                         else if(mapMap.Round%2==1){
        //                             mapMap.Players.forEach((ele)=>{
        //                                 if(ele.dead)return;
        //                                 if(ele.character=="黑影"){
        //                                     lis.push(ele.Loc);
        //                                 }
        //                             });
        //                         }
        //                         lis.sort((a,b)=>a-b);
        //                         let bc=main.getbc("round");
        //                         bc=bc.replace("[end]",mapMap.Round);
        //                         bc=bc.replace("[begin]",mapMap.Round+1);
        //                         bc=bc.replace("[char]",`位于${lis.join(" ")}的人`);
        //                         bc=bc.replace("[color]",main.getRoundColor(mapMap.Round+1));
        //                         main.broadcast(bc);
        //                     }
        //                 }
        //             }
        //         }
        //     ]
        // },
        {
            name:"毒气鲨极速版",
            notdefault:true,
            list:[
                {
                    name:"毒气",
                    stepend:{
                        priority:100,
                        fun:()=>{
                            let hasgas=new Map();
                            mapMap.items.forEach((item)=>{
                                if(item.name.includes("毒气")){
                                    let loc0=main.getLoc({ty:item.ty,val:item.val});
                                    //console.log(loc0);
                                    if(!loc0)return;
                                    hasgas.set(loc0,true);
                                }
                            });
                            //console.log(hasgas);
                            let neighbor=[];
                            mapMap.Locs.forEach((loc)=>{
                                if(hasgas.get(loc.id))return;
                                let flag=false;
                                mapMap.Locs.forEach((ele)=>{
                                    if(!hasgas.get(ele.id))return;
                                    if(!main.getDoor(loc.id,ele.id))return;
                                    //console.log(loc.id,ele.id);
                                    flag=true;
                                });
                                if(flag)neighbor.push(loc.id);
                            });
                            //console.log(neighbor);
                            mapMap.ModsData.gasneighbor=neighbor;
                            if(!neighbor.length)return;
                            document.querySelectorAll(".gas").forEach((ele)=>ele.remove());
                            let ggas=document.createElementNS("http://www.w3.org/2000/svg","g");
                            ggas.setAttribute("class","gas");
                            let tag=document.querySelector(".console");
                            tag.appendChild(ggas);
                            document.querySelectorAll(".LocPolygon").forEach((ele)=>{
                                if(!neighbor.includes(parseInt(ele.getAttribute("data-index"))))return;
                                let poly0=ele.cloneNode(true);
                                poly0.setAttribute("class","gasPoly");
                                poly0.setAttribute("fill",mapMap.COLOR_DEFAULT[4]);
                                poly0.setAttribute("fill-opacity",0.5/neighbor.length+0.2);
                                poly0.setAttribute("stroke-width",0);
                                poly0.setAttribute("pointer-events","none");
                                ggas.appendChild(poly0);
                            });
                        }
                    },
                    roundend:{
                        priority:100,
                        fun:()=>{
                            let neighbor=mapMap.ModsData.gasneighbor;
                            let des=neighbor[Math.floor(main.RANDOM()*neighbor.length)];
                            main.addItems([{"Loc":des,"color":4,"name":`毒气${mapMap.Round}`}]);
                        }
                    }
                }
            ]
        }
    ]
}

export {mods};