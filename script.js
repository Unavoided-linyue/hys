"use strict";

function mainMain() {
    // ----- 配置 -----      
    const TEXT_DEFAULT = "点击界面底部的名字来操作角色。"

    let mapMap = {};

    let doorDoor = new Map();
    let rulesMap = new Map();
    let bcMap =new Map();

    let STATUS={
        "ty":"normal",
        "val":null,
    }

    let compack={
        mapMap:()=>mapMap,
        STATUS:()=>STATUS
    }

    // 获取dom元素
    const layersContainer = document.getElementById('layersContainer');
    const roomInfoContent = document.getElementById('room-info-content');

    // ----- 工具函数：生成随机整数 (闭区间) -----
    function randomInt(min, max) {
        return Math.floor(RANDOM() * (max - min + 1)) + min;
    }
    function hsv2rgb(h, s, v) {
        let i, f, p1, p2, p3;
        let r = 0, g = 0, b = 0;
        if (s < 0) s = 0;
        if (s > 1) s = 1;
        if (v < 0) v = 0;
        if (v > 1) v = 1;
        h %= 360;
        if (h < 0) h += 360;
        h /= 60;
        i = Math.floor(h);
        f = h - i;
        p1 = v * (1 - s);
        p2 = v * (1 - s * f);
        p3 = v * (1 - s * (1 - f));
        switch(i) {
            case 0: r = v;  g = p3; b = p1; break;
            case 1: r = p2; g = v;  b = p1; break;
            case 2: r = p1; g = v;  b = p3; break;
            case 3: r = p1; g = p2; b = v;  break;
            case 4: r = p3; g = p1; b = v;  break;
            case 5: r = v;  g = p1; b = p2; break;
        }
        const toHex = (value) => value.toString(16).padStart(2, "0");
        return `#${toHex(Math.round(r * 255))}${toHex(Math.round(g * 255))}${toHex(Math.round(b * 255))}`
    }
    function getStrSize(str) {
        let len = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            // 判断是否为中文（基本汉字范围）
            if (/[\u4e00-\u9fa5]/.test(char)) {
                len += 2;
            } else {
                len += 1;
            }
        }
        return len;
    }
    function createPolygon(v,r){
        let x,y;
        let points='';
        for(let i=0;i<v;i++){
            x=r*Math.cos(2*Math.PI*i/v);
            y=r*Math.sin(2*Math.PI*i/v);
            points+=x+','+y+' ';
        }
        return points;
    }
    function getMida(a,b,c,d){
        if(d==0)return (a+b)/2;
        return (b*c+a*(d-c))/d;
    }
    function getLine(x0,y0,x1,y1){
        let path=document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x0} ${y0} L ${x1} ${y1}`);
        return path;
    }
    function getLineDim(x0,y0,x1,y1,d0){
        let path=document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let p=d0/Math.sqrt((x1-x0)*(x1-x0)+(y1-y0)*(y1-y0)+0.000001);
        let xa=x0+p*(y1-y0);
        let ya=y0-p*(x1-x0);
        let xb=x0-p*(y1-y0);
        let yb=y0+p*(x1-x0);
        path.setAttribute('d', `M ${xa} ${ya} L ${x1} ${y1} L ${xb} ${yb} Z`);
        return path;
    }
    function getDoor(LocId1,LocId2){
        if(LocId1>LocId2)[LocId1,LocId2]=[LocId2,LocId1];
        let door=doorDoor.get(LocId1+","+LocId2);
        return door;
    }
    function getNotPortal(LocId1,LocId2){
        let door=mapMap.Doors.find((door)=>door.type!="portal"&&((door.Loc1==LocId1&&door.Loc2==LocId2)||(door.Loc2==LocId1&&door.Loc1==LocId2)));
        return door;
    }
    function getPortal(RomId1,RomId2){
        let portal=mapMap.Doors.find((door)=>(door.Rom1==RomId1&&door.Rom2==RomId2)||(door.Rom2==RomId1&&door.Rom1==RomId2));
        return portal;
    }

    function hexarc(sx,sy,tx,ty){
        if(sx>tx){
            [sx,tx]=[tx,sx];
            [sy,ty]=[ty,sy];
        }
        let r=Math.sqrt((tx-sx)*(tx-sx)+(ty-sy)*(ty-sy))/Math.sqrt(2);
        return `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${tx} ${ty}`;
    }
    function getLocenter(Locid){
        return mapMap.Locs.find((Loc)=>Loc.id==Locid).center;
    }
    function getPath(LocId1,LocId2,x1,y1,x2,y2){
        if(!x1)x1=getLocenter(LocId1)[0];
        if(!y1)y1=getLocenter(LocId1)[1];
        if(!x2)x2=getLocenter(LocId2)[0];
        if(!y2)y2=getLocenter(LocId2)[1];
        let door=getDoor(LocId1,LocId2);
        //console.log(LocId1,LocId2,door);
        let path=document.createElementNS('http://www.w3.org/2000/svg', 'path');
        if(door==null){
            path.setAttribute('d', hexarc(x1,y1,x2,y2));
            path.setAttribute('stroke-dasharray', '4,4');
            return path;
        }
        else{
            if(door.type=="door"){
                path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
                return path;
            }
            else{
                path.setAttribute('d',  hexarc(x1,y1,x2,y2));
                return path;
            }
        }
    }
    function getImageUrlFromSvg(svgString) {
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        return URL.createObjectURL(blob);
    }
    async function copySvgAsPngToClipboard(svgElement) {
        if (!svgElement) {
            throw new Error('未提供 SVG 元素');
        }

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);

        //console.log('SVG:', svgElement); // 调试输出 SVG 字符串

        // 2. 创建一个 Image 对象来加载 SVG
        const img = new Image();
        
        // 注意：为了防止跨域问题和样式丢失，建议将 SVG 的宽度和高度信息内联
        // 或者从元素上读取宽高属性。这里为了示例，从元素上获取。
        const width = parseInt(svgElement.getAttribute('viewBox').split(' ')[2]*3) || 600;
        const height = parseInt(svgElement.getAttribute('viewBox').split(' ')[3]*3) || 800;

        // 3. 创建一个 Canvas 并设置尺寸
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // 4. 等待图片加载完成
        await new Promise((resolve, reject) => {
            img.onload = () => {
                // 图片加载成功后，绘制到 Canvas
                ctx.drawImage(img, 0, 0, width, height);
                resolve();
            };
            img.onerror = (err) => {
                reject(new Error('SVG 图片加载失败，请检查 SVG 内容。'));
            };
            // 将 SVG 字符串转为 URL 并赋给 img.src 开始加载
            const url = getImageUrlFromSvg(svgString);
            img.src = url;
        }).finally(() => {
            // 5. 无论加载成功或失败，都释放临时 URL
            if (img.src && img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }
        });

        // 6. 将 Canvas 内容转换为 Blob
        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/png'); // 使用 PNG 格式
        });

        if (!blob) {
            throw new Error('Canvas 转 Blob 失败');
        }

        // 7. 使用 Clipboard API 写入剪贴板
        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob
                })
            ]);
            console.log('图像已成功复制到剪贴板！');
        } catch (err) {
            console.error('复制到剪贴板失败: ', err);
            throw new Error('无法写入剪贴板，请检查浏览器权限。');
        }
    }
    function isValidCSSColor(color) {
        const colorRegex = /^(rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0(\.\d+)?|1(\.0+)?)\)|#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|hsl\(\d{1,3}, \d{1,3}%, \d{1,3}%\)|hsla\(\d{1,3}, \d{1,3}%, \d{1,3}%, (0(\.\d+)?|1(\.0+)?)\))$/;
        return colorRegex.test(color);
    }

    function shareEdge(poly1, poly2) {
        const eps = 1e-9;

        // 向量减法
        function sub(p, q) {
            return [p[0] - q[0], p[1] - q[1]];
        }
        // 点加向量
        function add(p, v) {
            return [p[0] + v[0], p[1] + v[1]];
        }
        // 向量数乘
        function mul(v, s) {
            return [v[0] * s, v[1] * s];
        }
        // 点积
        function dot(v, w) {
            return v[0] * w[0] + v[1] * w[1];
        }
        // 二维叉积
        function cross(v, w) {
            return v[0] * w[1] - v[1] * w[0];
        }

        // 判断两条线段的重合部分
        function segmentOverlap(seg1, seg2) {
            const A = seg1[0], B = seg1[1];
            const C = seg2[0], D = seg2[1];
            const AB = sub(B, A);
            const CD = sub(D, C);

            // 检查是否平行
            if (Math.abs(cross(AB, CD)) > eps) return null;

            // 检查是否共线：点 A 到直线 CD 的距离是否为 0
            const AC = sub(C, A);
            if (Math.abs(cross(AC, CD)) > eps) return null;

            // 两线段在同一直线上，计算重叠区间
            const v = AB;
            const vv = dot(v, v);
            if (vv < eps) return null; // AB 退化为点，忽略

            // 计算各点在方向 v 上的投影参数 s = (P - A) · v
            const sA = 0.0;
            const sB = dot(sub(B, A), v); // 即 vv
            const sC = dot(sub(C, A), v);
            const sD = dot(sub(D, A), v);

            const low1 = Math.min(sA, sB);
            const high1 = Math.max(sA, sB);
            const low2 = Math.min(sC, sD);
            const high2 = Math.max(sC, sD);

            const low = Math.max(low1, low2);
            const high = Math.min(high1, high2);

            if (high - low <= eps) return null; // 仅点接触或无重叠

            // 将参数区间转换回点坐标
            const p1 = add(A, mul(v, low / vv));
            const p2 = add(A, mul(v, high / vv));
            return [p1, p2];
        }

        const n = poly1.length;
        const m = poly2.length;
        const overlaps = [];

        for (let i = 0; i < n; i++) {
            const A = poly1[i];
            const B = poly1[(i + 1) % n];
            const seg1 = [A, B];
            for (let j = 0; j < m; j++) {
                const C = poly2[j];
                const D = poly2[(j + 1) % m];
                const seg2 = [C, D];
                const overlap = segmentOverlap(seg1, seg2);
                if (overlap) {
                    overlaps.push(overlap);
                }
            }
        }

        //console.log(overlaps,poly1,poly2);

        return overlaps;
    }

    function swapRom(Loc1,Loc2){
        if(Loc1==Loc2)return;
        [Loc1.rom,Loc2.rom]=[Loc2.rom,Loc1.rom];
        mapMap.Players.forEach((ele)=>{
            if(ele.Loc==Loc1.id){
                ele.Loc=Loc2.id;
            }
            else if(ele.Loc==Loc2.id){
                ele.Loc=Loc1.id;
            }
        });
        
    }

    function eraseBracket(str){
        return str.replace(/（.*?）/g,"");
    }
    
    let DB=null;

    function initDB(){
        var request = indexedDB.open('myDatabase', 1);
        request.onupgradeneeded = function(event) {
            var db = event.target.result;
            var saves= db.createObjectStore('saves', { keyPath: 'id' });
            saves.createIndex('val', 'val', { unique: false });
        };
        return new Promise((resolve)=>{
            request.onsuccess = function(event) {
                DB = event.target.result;
                resolve();
            };
        });
    }

    function parseItem(str){
        let parts=str.trim().split(' ');
        console.log(parts);
        if(parts.length<3)return null;
        let lor=getLocorRom(parts[0]);
        if(!lor)return null;
        let item={};
        if(lor.ty=="Loc")item.Loc=lor.val;
        if(lor.ty=="Rom")item.Rom=lor.val;
        item.color=parseColor(parts[2]);
        item.name=parts[1];
        let strc=parts[3]||"";
        if(strc.includes("S"))item.static=true;
        if(strc.includes("M"))item.type="机关";
        if(strc.includes("K"))item.keepInventory=true;
        if(strc.includes("I"))item.invisible=true;
        if(strc.includes("V"))item.alwayVisibie=true;
        console.log(item);
        return item;
    }

    function gameinit(){
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

        let buttonrec=document.createElement('button');
        buttonrec.textContent="使用上局设定";
        buttonrec.addEventListener('click',()=>{
            let las=localStorage.getItem("lastConfig");
            if(!las){
                alert("没有上局设定。");
                return;
            }
            let lasConfig=JSON.parse(las);
            console.log(lasConfig);
            mapMap.seed=lasConfig.seed;
            mapMap.plastr=lasConfig.plastr;
            mapMap.itmstr=lasConfig.itmstr;
            mapMap.ModsConfig=lasConfig.ModsConfig;
            gameinit();
        });

        contentDiv.appendChild(buttonrec);

        let seeddiv=document.createElement('div');
        seeddiv.style.color="#0cf";
        seeddiv.style.display="flex";
        contentDiv.appendChild(seeddiv);
        let setsseed=document.createElement('p');
        setsseed.innerText="随机种子：";
        seeddiv.appendChild(setsseed);
        let seed=document.createElement('p');
        seed.setAttribute("contenteditable","true");
        seed.innerText=mapMap.seed||'';
        seed.addEventListener('keydown',(e)=>{
            if(e.key=="Enter"){
                seed.blur();
            }
        });
        seed.addEventListener('blur',()=>{
            mapMap.seed=seed.innerText.trim();
        });
        seeddiv.appendChild(seed);

        let plalis=document.createElement('p');
        plalis.innerText="游玩人员：";
        contentDiv.appendChild(plalis);
        let pl0=document.createElement('p');
        pl0.innerText=mapMap.plastr||'（请输入名字，用换行隔开，不需要输入人数了）';
        pl0.setAttribute("contenteditable","true");
        pl0.addEventListener('input',()=>{
            mapMap.plastr=pl0.innerText;
        });
        contentDiv.appendChild(pl0);

        let itemslis=document.createElement('p');
        itemslis.innerText="可以在这里添加额外的初始标记，格式为“房间简称或位置编号 标记名 颜色 特性”，用空格隔开。特性是一个字符串，当包含以下字符时：S，不受重启影响；M，作为六边形机关；K，死亡不掉落；I，角色界面不可见；V，总是可见。";
        itemslis.style.color="#ccc";
        itemslis.style.fontSize="0.9rem";
        contentDiv.appendChild(itemslis);
        let il0=document.createElement('p');
        il0.innerText=mapMap.itmstr||'（请输入文本）';
        il0.setAttribute("contenteditable","true");
        il0.addEventListener('input',()=>{
            mapMap.itmstr=il0.innerText;
        });
        itemslis.appendChild(il0);

        console.log(modpacks);

        modpacks.forEach((modpack)=>{
            let packdiv=document.createElement('div');
            packdiv.style.fontSize="0.9rem";
            packdiv.style.borderBottom="1px solid #fff";
            packdiv.style.paddingBottom="3px";
            let label = document.createElement('label');
            let checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.value = modpack.name;
            checkbox.style.margin="5px";
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`要加载模组 ${modpack.name} 吗？`));
            contentDiv.appendChild(label);
            checkbox.checked=mapMap.ModsConfig[modpack.name]||false;
            let lisdiv=document.createElement('div');
            let func=()=>{
                modpack.list.forEach((mod)=>{
                    mapMap.ModsConfig[mod.name]=mapMap.ModsConfig[mod.name]||{disabled:false};
                    let moddiv=document.createElement('div');
                    moddiv.style.fontSize="0.8rem";
                    moddiv.style.color="#fff";
                    let modcheckbox=document.createElement('input');
                    modcheckbox.type="checkbox";
                    modcheckbox.value=mod.name;
                    modcheckbox.style.margin="5px";
                    modcheckbox.checked=!mapMap.ModsConfig[mod.name].disabled;
                    modcheckbox.addEventListener('change',()=>{
                        mapMap.ModsConfig[mod.name].disabled=!modcheckbox.checked;
                    });
                    moddiv.appendChild(modcheckbox);
                    moddiv.appendChild(document.createTextNode(mod.name));
                    if(mod.config){
                        mod.config(moddiv);
                    }
                    lisdiv.appendChild(moddiv);
                });
            }
            if(checkbox.checked){
                func();
            }
            checkbox.addEventListener('change',()=>{
                mapMap.ModsConfig[modpack.name]=checkbox.checked;
                if(checkbox.checked){
                    func();
                }
                else{
                    lisdiv.innerHTML="";
                }
            });
            packdiv.appendChild(label);
            packdiv.appendChild(lisdiv);
            contentDiv.appendChild(packdiv);
        });


        let button0=document.createElement('button');
        button0.textContent="开始游戏";
        button0.style.marginTop="3px";
        button0.addEventListener('click',async ()=>{
            button0.style.display="none";

            if(!mapMap.seed){
                alert("种子不能为空。");
                button0.style.display="";
                return;
            }
            if(!mapMap.plastr){
                alert("人员不能为空。");
                button0.style.display="";
                return;
            }

            let lasConfig={
                seed:mapMap.seed,
                plastr:mapMap.plastr,
                itmstr:mapMap.itmstr,
                ModsConfig:mapMap.ModsConfig,
            };

            localStorage.setItem("lastConfig",JSON.stringify(lasConfig));

            setseed(mapMap.seed);

            const response = await fetch('map.json');

            if (!response.ok) {
                throw new Error(`加载地图失败: ${response.status}`);
            }

            initMods();

            let mapData = await response.json();

            Object.assign(mapMap,mapData);

            initLocs();

            mapMap.items=[];

            let lines = mapMap.plastr.trim().split(/\r?\n/);
            Reflect.deleteProperty(mapMap,"plastr");
            let items = mapMap.itmstr?mapMap.itmstr.trim().split(/\r?\n/):[];
            Reflect.deleteProperty(mapMap,"itmstr");

            items.forEach((itm)=>{
                addItems([parseItem(itm)]);
            });

            addItems(structuredClone(mapData.itemsDefault));

            console.log(lines);
            let Players0=[];
            let id=0;
            lines.forEach((line) => {
                let name0=eraseBracket(line).trim();;
                if(name0!=''){
                    ++id;
                    Players0.push({
                        "id":id,
                        "name":name0
                    });
                }
            });
            if(!Players0.length){
                alert("人员不能为空。");
                return;
            }
            Players0.sort(()=>RANDOM()-0.5)
            for(let i=0;i<Players0.length;i++){
                if(i==Players0.length-1){
                    Players0[i].character="黑影";
                }
            }

            mapMap.Players=Players0;

            initMapData();

            overlay.remove();
        });
        contentDiv.appendChild(button0);

        popup.appendChild(contentDiv);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    async function title(){
        await initDB();
        mapMap.ModsConfig={};
        await loadMods();
        setseed("forever");

        const img = document.createElement('img');
        img.src = 'title.png';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        document.getElementById('layersContainer').appendChild(img);
        let infop1=document.getElementById('infop1');
        let button0=document.createElement('button');
        button0.textContent="开始游戏";
        button0.addEventListener('click',()=>{
            gameinit();
        });
        infop1.appendChild(button0);
        // let button1=document.createElement('button');
        // button1.textContent="设置模组";
        // button1.addEventListener('click',()=>{
        //     showMods();
        // });
        // infop1.appendChild(button1);
        // let button2=document.createElement('button');
        // button2.textContent="随机种子";
        // button2.addEventListener('click',()=>{
        //     setseed();
        // });
        // infop1.appendChild(button2);
        // let rpbutton=document.createElement('button');
        // rpbutton.textContent="保存复盘";
        // rpbutton.addEventListener('click',async ()=>{
        //     await window.downloadHtmlToPpt('replay-round', '复盘');
        // });
        // let rpdiv=document.querySelector(".replay");
        // rpdiv.appendChild(rpbutton);
    }

    function initLocs(){
        if(mapMap.LocRectangles){
            for(let i=0;i<mapMap.LocRectangles.length;i++){
                let cur=mapMap.LocRectangles[i];
                let x0=mapMap.floors.find((ele)=>ele.id==cur.floor).x;
                let y0=mapMap.floors.find((ele)=>ele.id==cur.floor).y;
                let loc0={};
                loc0.id=cur.id;
                loc0.vertices=[];
                loc0.vertices.push([cur.x+x0,cur.y+y0]);
                loc0.vertices.push([cur.x+x0,cur.y+cur.h+y0]);
                loc0.vertices.push([cur.x+cur.w+x0,cur.y+cur.h+y0]);
                loc0.vertices.push([cur.x+cur.w+x0,cur.y+y0]);
                loc0.visPlayer=cur.visPlayer||[];
                loc0.centerOri=cur.centerOri;
                loc0.floor=cur.floor;
                mapMap.Locs.push(loc0);
            }
        }

        Reflect.deleteProperty(mapMap, 'LocRectangles');

        mapMap.Locs.forEach((Loc0) => {
            if(Loc0.centerOri==null){
                let cx=0,cy=0,len=Loc0.vertices.length;
                Loc0.vertices.forEach((v) => {
                    cx+=v[0];
                    cy+=v[1];
                });
                Loc0.center=[cx/len,cy/len];
                Reflect.deleteProperty(Loc0,"centerOri");
            }
            else{
                let floor0=mapMap.floors.find((ele)=>ele.id==Loc0.floor);
                Loc0.center=[Loc0.centerOri[0]+floor0.x,Loc0.centerOri[1]+floor0.y];
                Loc0.vertices.forEach((v) => {
                    v=[v+floor0.x,v+floor0.y];
                });
                Reflect.deleteProperty(Loc0,"centerOri");
            }
            Loc0.rom=Loc0.id;
        });
    }


    async function initMapData(Players0) {
        try {
            initPlayers();

            await initIcon();

            await initRule();

            ModsInitEvent();

            switchNormalMode();

        } catch (error) {
            console.error('内部错误:', error);
            roomInfoContent.textContent = '内部错误';
        }
    }

    function createG(){
        layersContainer.innerHTML = '';

        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'console');
        svg.setAttribute('viewBox', `0 0 ${mapMap.width} ${mapMap.height}`);
        svg.setAttribute('id', 'mainsvg');
        svg.setAttribute('overflow', 'visible');

        let gMap=document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gMap.setAttribute('id', 'gMap');
        svg.appendChild(gMap);

        let gAll=document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gAll.setAttribute('id', 'gAll');
        let gMask=document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gMask.setAttribute('id', 'gMask');
        
        svg.appendChild(gAll);
        svg.appendChild(gMask);

        let gDoor=document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gDoor.setAttribute('id', 'gDoor');
        
        svg.appendChild(gDoor);
        

        let svgCarrier=document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgCarrier.setAttribute('class', 'carrier');
        let ratio=mapMap.height/mapMap.width;
        svgCarrier.setAttribute('viewBox', `0 0 600 ${600*ratio+80}`);
        svgCarrier.setAttribute('id', 'carrier');
        svgCarrier.addEventListener('mousedown', (e) => e.preventDefault());
        //svgCarrier.style.border = '1px solid #ccc';

        svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        svg.setAttribute('y', '40');

        svgCarrier.appendChild(svg);

        let gNames=document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gNames.setAttribute('id', 'gNames');
        svgCarrier.appendChild(gNames);

        let gItem=document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gItem.setAttribute('id', 'gItem');
        svgCarrier.appendChild(gItem);

        layerDiv.appendChild(svgCarrier);
        layersContainer.appendChild(layerDiv);

        let infop=document.getElementById("infop1");
        infop.innerHTML = '';

        let info=document.createElement('div');
        info.setAttribute('id', 'info');
        infop.appendChild(info);

        let buttonDiv=document.createElement('div');
        buttonDiv.setAttribute('id', 'buttonDiv');
        infop.appendChild(buttonDiv);
    }

    function initDoor(){
        doorDoor=new Map();
        mapMap.Doors.forEach((door) => {
            if(door.type=="portal"){
                let Loc1=mapMap.Locs.find((ele)=>ele.rom==door.Rom1).id;
                let Loc2=mapMap.Locs.find((ele)=>ele.rom==door.Rom2).id;
                if(Loc1>Loc2)[Loc1,Loc2]=[Loc2,Loc1];
                doorDoor.set(`${Loc1},${Loc2}`,door);
                door.Loc1=Loc1;
                door.Loc2=Loc2;
            }
            if(door.Loc1>door.Loc2)[door.Loc1,door.Loc2]=[door.Loc2,door.Loc1];
            doorDoor.set(door.Loc1+","+door.Loc2,door);
            let Loc1=mapMap.Locs.find((ele)=>ele.id==door.Loc1);
            let Loc2=mapMap.Locs.find((ele)=>ele.id==door.Loc2);
            if(!door.type){
                if(Loc1.floor!=Loc2.floor)
                    door.type="stair";
                else{
                    let li=shareEdge(Loc1.vertices,Loc2.vertices);
                    if(li.length){
                        door.type="door";
                    }
                    else door.type="stair";
                }
            }
            if(door.type=="door"){
                if(!door.centerOri){
                    let cx=(Loc1.center[0]+Loc2.center[0])/2;
                    let cy=(Loc1.center[1]+Loc2.center[1])/2;
                    door.center=[cx,cy];
                    let li=shareEdge(Loc1.vertices,Loc2.vertices);
                    if(li.length){
                        door.center=[(li[0][0][0]+li[0][1][0])/2,(li[0][0][1]+li[0][1][1])/2];
                    }
                }
                else{
                    let floor0=mapMap.floors.find((ele)=>ele.id==Loc1.floor);
                    let cx=door.centerOri[0]+floor0.x;
                    let cy=door.centerOri[1]+floor0.y;
                    door.center=[cx,cy];
                }
            }
        });
    }

    function drawDoor(player,dis0,stpRem){
        let gDoor=document.getElementById('gDoor');
        gDoor.innerHTML='';
        mapMap.Doors.forEach((door) => {
            if(door.type=="door"){
                let w0=8,h0=8;
                let rect0=document.createElementNS('http://www.w3.org/2000/svg','rect');
                rect0.setAttribute('x', door.center[0]-w0/2);
                rect0.setAttribute('y', door.center[1]-h0/2);
                rect0.setAttribute('width', w0);
                rect0.setAttribute('height', h0);
                rect0.setAttribute('fill', '#000');
                rect0.setAttribute('stroke', '#ccc');
                rect0.setAttribute('stroke-width', 0.6);
                rect0.addEventListener("click",()=>{
                    let info=document.getElementById('info');
                    info.innerHTML=`${door.Loc1}到${door.Loc2}的门。${door.disabled?"无法通行。":""}`;
                    let buttonDiv=document.getElementById('buttonDiv');
                    buttonDiv.innerHTML='';
                    getButton('#fff','返回',()=>{
                        jumpAccordSTATUS();
                    });
                    buttonDiv.appendChild(document.createElement('br'));
                    getButton('#fff','直接修改门信息',()=>{
                        showEditor(door);
                        jumpAccordSTATUS();
                    });
                })
                let insight=true;
                if(player){
                    let da=dis0.get(door.Loc1),db=dis0.get(door.Loc2);
                    if(Math.min(db===null?stpRem+1:da,db===null?stpRem+1:db)>=stpRem){
                        insight=false;
                    }
                }
                if(insight){
                    if(door.isExtra){
                        rect0.setAttribute('fill', "#080");
                    }
                    if(door.disabled){
                        rect0.setAttribute('fill', "#800");
                    }
                    gDoor.appendChild(rect0);
                }
                else{
                    if(!door.isExtra)gDoor.appendChild(rect0);
                }
            }
            else{
                if((door.isExtra||door.disabled)&&STATUS.ty!="round"){
                    let path0=getPath(door.Loc1,door.Loc2);
                    if(door.disabled)path0.setAttribute('stroke', mapMap.COLOR_DEFAULT[1]);
                    if(door.type=="portal")path0.setAttribute('stroke', mapMap.COLOR_DEFAULT[5]);
                    else if(door.isExtra)path0.setAttribute('stroke', mapMap.COLOR_DEFAULT[4]);
                    path0.setAttribute('stroke-width', 8);
                    path0.setAttribute('stroke-opacity', '0.5');
                    path0.setAttribute('fill', 'none');
                    gDoor.appendChild(path0);
                }
            }
            if(player){
                let da=dis0.get(door.Loc1),db=dis0.get(door.Loc2);
                let path=getPath(door.Loc1,door.Loc2);
                if(door.disabled){
                   if(Math.min(da||stpRem+1,db||stpRem+1)>=stpRem)return;
                   path.setAttribute('stroke', mapMap.COLOR_DEFAULT[1]);
                }
                else{
                    if(da==null||db==null)return;
                    if(Math.max(da,db)>stpRem)return;
                    if(Math.min(da,db)>=stpRem)return;
                    path.setAttribute('stroke', mapMap.COLOR_DEFAULT[0]);
                    if(door.type=="portal")path.setAttribute('stroke', mapMap.COLOR_DEFAULT[5]);
                    else if(door.isExtra)path.setAttribute('stroke', mapMap.COLOR_DEFAULT[4]);
                }
                path.setAttribute('stroke-opacity', '0.25');
                path.setAttribute('stroke-width', 12);
                path.setAttribute('fill', 'none');
                path.setAttribute('pointer-events', 'none');
                gDoor.appendChild(path);
            }
        });
    }

    function initPlayers(){
        mapMap.Players.forEach((player) => {
            player.character=player.character||"玩家";
        });
        mapMap.Players.forEach((player,i) => {
            let hue=360/(mapMap.Players.length)*(i+1);
            player.color=player.color||hsv2rgb(hue,1*(1+(Math.min(Math.abs(hue-240),60)-60)/240),1);
            player.steps=player.steps||0;
            player.stpData=player.stpData||[];
            player.Loc=player.Loc||Math.floor(RANDOM()*mapMap.Locs.length+1);
        });
        mapMap.Players.forEach((player,i) => {
            let x=0; let y=mapMap.height+55;
            if(mapMap.Players.length>1)x=getMida(40,560,i,mapMap.Players.length-1);
            else x=300;
            player.center=[x,y];
        });

    }

    function addItems(itemsReady){
        let maxid=0;
        mapMap.items.forEach((item) => {
            if(item.id>maxid)maxid=item.id;
        });
        console.log(itemsReady);
        itemsReady.forEach((item,i) => {
            if(!item)return;
            item.id=maxid+1+i;
            if(item.Rom){
                item.ty="Rom";
                item.val=item.Rom||randomInt(1,mapMap.Loc.length);
                Reflect.deleteProperty(item,"Rom");
            }
            if(item.Loc){
                item.ty="Loc";
                item.val=item.Loc||randomInt(1,mapMap.Rom.length);
                Reflect.deleteProperty(item,"Loc");
            }
            if(item.Player){
                item.ty="Player";
                item.val=item.Player||randomInt(1,mapMap.Players.length);
                Reflect.deleteProperty(item,"Player");
            }
            item.color=parseColor(item.color);
            item.size=getStrSize(item.name);
            item.type=item.type||"物品";
            if(item.type=="机关"){
                item.alwayVisibie=true;
            }
            catchItemAppendFunctions([item]);
            mapMap.items.push(item);
        });
        console.log(mapMap.items);
    }

    function getLoc(lor){
        if(!lor||!lor.ty)return null;
        if(lor.ty=="Loc")return lor.val;
        if(lor.ty=="Rom")return mapMap.Locs.find((ele)=>ele.rom==lor.val).id;
        return null;
    }

    function setDoor(){
        let str=prompt("请输入两个位置编号或房间名，可以输入简称。");
        let lis=str.split(" ");
        if(lis.length!=2)return;
        [lis[0],lis[1]]=[getLocorRom(lis[0]),getLocorRom(lis[1])];
        if(lis[0].ty=="Rom"&&lis[1].ty=="Rom"){
            [lis[0],lis[1]]=[lis[0].val,lis[1].val];
            if(lis[0]==lis[1])return;
            let door0=getPortal(lis[0],lis[1]);
            if(door0){
                if(door0.isExtra){
                    let dp=mapMap.Doors.indexOf(door0);
                    mapMap.Doors.splice(dp,1);
                }
                else{
                    if(door0.disabled)door0.disabled=null;
                    else door0.disabled=true;
                }
            }
            else{
                mapMap.Doors.push({
                    "Rom1":lis[0],
                    "Rom2":lis[1],
                    "type":"portal",
                    "isExtra":true
                });
            }
        }
        else{
            [lis[0],lis[1]]=[getLoc(lis[0]),getLoc(lis[1])];
            if(lis[0]==null||lis[1]==null)return;
            if(lis[0]==lis[1])return;
            let door0=getNotPortal(lis[0],lis[1]);
            if(door0){
                if(door0.isExtra){
                    let dp=mapMap.Doors.indexOf(door0);
                    mapMap.Doors.splice(dp,1);
                }
                else{
                    if(door0.disabled)door0.disabled=null;
                    else door0.disabled=true;
                }
            }
            else{
                mapMap.Doors.push({
                    "Loc1":lis[0],
                    "Loc2":lis[1],
                    "isExtra":true
                });
            }
        }
    }

    
    
    function drawNames(){
        let svg=document.getElementById('gNames');
        svg.innerHTML='';
        mapMap.Players.forEach((player,i) => {
            let name0 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            let x =0;
            if(mapMap.Players.length>1)x=getMida(40,560,i,mapMap.Players.length-1);
            else x=300;
            name0.setAttribute('x', x);
            name0.setAttribute('y', mapMap.height+55);
            name0.setAttribute('fill', player.color);
            name0.setAttribute('font-size', `${Math.min(16,90/(getStrSize(player.name)))}px`);
            name0.setAttribute('text-anchor', 'middle');
            name0.setAttribute('dominant-baseline', 'central')
            name0.textContent=player.name;
            name0.setAttribute('id', `namePlayer${player.id}`);
            name0.setAttribute('class', 'namePlayer');
            name0.addEventListener('click', () => {
                switchMoveMode(player);
            });
            let stpUsed=0;
            player.stpData.forEach((stp) => {stpUsed+=stp.stp?stp.stp:1;});
            let stpRem=Math.max(player.steps-stpUsed,0);
            if(stpRem==0)name0.setAttribute('opacity', 0.5);
            let stpText=document.createElementNS('http://www.w3.org/2000/svg', 'text');
            stpText.setAttribute('x', x);
            stpText.setAttribute('y', mapMap.height+42);
            stpText.setAttribute('fill', player.color);
            stpText.setAttribute('font-size', "10px");
            stpText.setAttribute('text-anchor', 'middle');
            stpText.setAttribute('dominant-baseline', 'central')
            stpText.textContent=`${stpRem}/${player.steps}`;
            svg.appendChild(stpText);
            if(player.dead){
                name0.setAttribute('opacity', 0.5);
                let y=mapMap.height+55;
                let gCross=getCross(x-24,y-12,x+24,y+12);
                gCross.setAttribute('stroke', player.color);
                gCross.setAttribute('stroke-width', 2.4);
                gCross.setAttribute('class', 'namePlayer');
                svg.appendChild(gCross);
            }
            svg.appendChild(name0); 
        });
    }

    function getCross(x1,y1,x2,y2){
        let gCross=document.createElementNS('http://www.w3.org/2000/svg', 'g');
        let line1=document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line1.setAttribute('x1', x1);
        line1.setAttribute('y1', y1);
        line1.setAttribute('x2', x2);
        line1.setAttribute('y2', y2);
        let line2=document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line2.setAttribute('x1', x1);
        line2.setAttribute('y1', y2);
        line2.setAttribute('x2', x2);
        line2.setAttribute('y2', y1);
        gCross.appendChild(line1);
        gCross.appendChild(line2);
        return gCross;
    }

    function clearMechan(){
        mapMap.items.forEach((item) => {
            if(item.type=="机关"){
                if(item.destXY)Reflect.deleteProperty(item,"destXY");
                if(item.used&&item.used!="主持")Reflect.deleteProperty(item,"used");
            }
        });
    }
    function drawPlayers(curPlayers,color0){
        clearMechan();
        let LocSteps=Array.from({length: mapMap.Locs.length+1}, () => 0);
        let wdelta=1;
        if(curPlayers)wdelta=1.5;
        curPlayers=curPlayers||mapMap.Players;
        curPlayers.forEach((player) => {
            let Loc0=player.Loc;
            LocSteps[Loc0]++;
                player.stpData.forEach((stp) => {
                if(stp.ty=="Go"){
                    Loc0=stp.val;
                }
                LocSteps[Loc0]++;
            });
            player.Loclast=Loc0;
        });
        let LocSteps0=Array.from({length: mapMap.Locs.length+1}, () => 0);
        let gAll=document.getElementById('gAll');
        gAll.innerHTML='';
        curPlayers.forEach((player) => {
            let Loc0=player.Loc;
            LocSteps0[Loc0]++;
            let g=document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('id', `pathPlayer${player.id}`);
            g.setAttribute('class', 'pathPlayer');
            player.stpData.forEach((stp) => {
                if(stp.ty=="Go"){
                    let a=getMida(-20,20,LocSteps0[Loc0],LocSteps[Loc0]+1);
                    let x0=getLocenter(Loc0)[0]+a;
                    let y0=getLocenter(Loc0)[1]+a;
                    let Loc1=Loc0;
                    Loc0=stp.val;
                    LocSteps0[Loc0]++;
                    let b=getMida(-20,20,LocSteps0[Loc0],LocSteps[Loc0]+1);
                    let x1=getLocenter(Loc0)[0]+b;
                    let y1=getLocenter(Loc0)[1]+b;
                    let path=getPath(Loc0,Loc1,x0,y0,x1,y1);
                    path.setAttribute('stroke', color0||player.color);
                    path.setAttribute('stroke-width', 2.4*wdelta);
                    path.setAttribute('fill', 'none');
                    g.appendChild(path);
                }
                else{
                    let a=getMida(-20,20,LocSteps0[Loc0],LocSteps[Loc0]+1);
                    LocSteps0[Loc0]++;
                    let dot=document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    let x=getLocenter(Loc0)[0]+a;
                    let y=getLocenter(Loc0)[1]+a;
                    dot.setAttribute('cx', x);
                    dot.setAttribute('cy', y);
                    dot.setAttribute('r', 4);
                    dot.setAttribute('stroke', 'none');
                    dot.setAttribute('fill', color0||player.color);
                    g.appendChild(dot);
                    if(stp.ty=="Loc"){
                        let x0=getLocenter(stp.val)[0];
                        let y0=getLocenter(stp.val)[1];
                        let path=getLineDim(x,y,x0,y0,2.4*wdelta);
                        path.setAttribute('fill', color0||player.color);
                        path.setAttribute('fill-opacity',0.8);
                        path.setAttribute('stroke','none');
                        g.appendChild(path);
                    }
                    if(stp.ty=="Rom"){
                        let Loc0=mapMap.Locs.find((ele)=>ele.rom==stp.val);
                        Loc0.vertices.forEach((v) => {
                            let path=getLineDim(v[0],v[1],x,y,1.5*wdelta);
                            path.setAttribute('fill', color0||player.color);
                            path.setAttribute('fill-opacity',0.5);
                            path.setAttribute('stroke','none');
                            g.appendChild(path);
                        });
                    }
                    if(stp.ty=="Mechan"){
                        let item0=mapMap.items.find((ele)=>ele.name==stp.val&&ele.type=="机关");
                        item0.destXY=[x,y];
                        item0.used=player;
                    }
                }
            });
            let a=getMida(-20,20,LocSteps0[Loc0],LocSteps[Loc0]+1);
            if(player.dead==true){
                let cx=getLocenter(Loc0)[0]+a;
                let cy=getLocenter(Loc0)[1]+a;
                let gcross= getCross(cx-10,cy-10,cx+10,cy+10);
                gcross.setAttribute('stroke', color0||player.color);
                gcross.setAttribute('stroke-width', 2.4*wdelta)
                g.appendChild(gcross);
                g.setAttribute('opacity', 0.5);
                let circ0 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circ0.setAttribute('cx', getLocenter(Loc0)[0]+a);
                circ0.setAttribute('cy', getLocenter(Loc0)[1]+a);
                circ0.setAttribute('id', `circlePlayer${player.id}`);
                circ0.setAttribute('display', 'none');
                g.appendChild(circ0);
            }
            else{
                let circ0 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circ0.setAttribute('cx', getLocenter(Loc0)[0]+a);
                circ0.setAttribute('cy', getLocenter(Loc0)[1]+a);
                circ0.setAttribute('r', 10*wdelta);
                circ0.setAttribute('stroke', color0||player.color);
                circ0.setAttribute('stroke-width', 2.4*wdelta);
                circ0.setAttribute('fill', 'none');
                circ0.setAttribute('id', `circlePlayer${player.id}`);
                g.appendChild(circ0);
            }
            gAll.appendChild(g);
        });
        let curs=document.querySelector('#cursor');
        //console.log(curs);
        if(curs)curs.remove();
        if(STATUS.ty=="move"){
            let player=STATUS.val;
            let x0=document.getElementById(`circlePlayer${player.id}`).cx.baseVal.value;
            let y0=document.getElementById(`circlePlayer${player.id}`).cy.baseVal.value+document.getElementById(`mainsvg`).y.baseVal.value;
            let x1=document.getElementById(`namePlayer${player.id}`).x.baseVal[0].value;
            let y1=mapMap.height+35;
            let path=getLine(x0,y0,x1,y1);
            path.setAttribute('stroke', player.color);
            path.setAttribute('stroke-width', 3);
            path.setAttribute('fill', 'none');
            path.setAttribute('id', `cursor`);
            let carrier=document.getElementById('carrier');
            carrier.appendChild(path);
        }
    }

    function addItemsAdvanced(){
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

        let itemslis=document.createElement('p');
        itemslis.innerText="在这里添加标记，格式为“房间简称或位置编号 标记名 颜色 特性”，用空格隔开。特性是一个字符串，当包含以下字符时：S，不受重启影响；M，作为六边形机关；K，死亡不掉落；I，角色界面不可见；V，总是可见。";
        itemslis.style.color="#ccc";
        itemslis.style.fontSize="0.9rem";
        contentDiv.appendChild(itemslis);
        let il0=document.createElement('p');
        il0.innerText=mapMap.itmstr||'（请输入文本）';
        il0.setAttribute("contenteditable","true");
        il0.addEventListener('input',()=>{
            mapMap.itmstr=il0.innerText;
        });
        itemslis.appendChild(il0);

        let button0=document.createElement('button');
        button0.textContent="完成";
        button0.style.marginTop="3px";
        button0.addEventListener('click',()=>{
            let items = mapMap.itmstr.trim().split(/\r?\n/);
            Reflect.deleteProperty(mapMap,"itmstr");

            items.forEach((itm)=>{
                addItems([parseItem(itm)]);
            });
            overlay.remove();
            jumpAccordSTATUS(); 
        });
        contentDiv.appendChild(button0);

        popup.appendChild(contentDiv);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    function switchNormalMode(){
        STATUS.ty='normal';
        STATUS.val=null;
        createG();
        renderAllLayers();
        let info=document.getElementById('info');
        info.innerHTML=TEXT_DEFAULT;
        info.style.color="";
        let buttonDiv=document.getElementById('buttonDiv');
        buttonDiv.innerHTML='';
        let ruleDiv=document.getElementById('rule1');
        ruleDiv.innerHTML='';
        getButton('#fff','完成',()=>{
            nextRound();
        });
        getButton('#fff','存档',()=>{
            saveMap();
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton('#fff','交换房间',()=>{
            let str=prompt('请输入两个位置编号');
            str=str.trim();
            let arr=str.split(" ");
            if(arr.length!=2)return;
            console.log(arr);
            let Loc1=mapMap.Locs.find((ele)=>ele.id==parseInt(arr[0]));
            let Loc2=mapMap.Locs.find((ele)=>ele.id==parseInt(arr[1]));
            swapRom(Loc1,Loc2);
            console.log(Loc1,Loc2);
            jumpAccordSTATUS();
        });

        getButton('#fff','改建',()=>{
            setDoor();
            jumpAccordSTATUS();
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton('#fff','批量加标记',()=>{
            addItemsAdvanced();
        });

        getButton('#fff','直接修改地图信息',()=>{
            showEditor(mapMap);
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton('#fff','恢复数据',()=>{
            recoverGame();
        });

        LocMaskEvent([
            {
                ty: 'click',
                lamda: (Locid,poly0) => {
                    return ()=>{
                        let Loc0=mapMap.Locs.find((ele)=>ele.id==Locid); 
                        defaultLocMaskAction(Loc0);
                    }
                }
            }
        ]);
        ModsStependEvent();
    }

    function defaultLocMaskAction(Loc0){
        jumpAccordSTATUS();
        let info=document.getElementById('info');
        info.innerHTML=`${Loc0.id}:${mapMap.Roms.find((ele)=>ele.id==Loc0.rom).name}。`;
        let buttonDiv=document.getElementById('buttonDiv');
        buttonDiv.innerHTML='';
        let ruleDiv=document.getElementById('rule1');
        let rule0=rulesMap.get(mapMap.Roms.find((ele)=>ele.id==Loc0.rom).name);
        if(rule0){
            ruleDiv.innerHTML=rule0.val;
        }
        else{
            ruleDiv.innerHTML='白板。恭喜！';
        }
        getButton('#fff','返回',()=>{
            jumpAccordSTATUS();
        });
        getButton('#fff','加标记',()=>{
            let str=prompt('请输入物品名。');
            if(!str)return;
            str=str.trim();
            if(!str)return;
            let color0=getColor();
            if(!color0)return;
            let rom0=mapMap.Roms.find((ele)=>ele.id==Loc0.rom);
            addItems([{
                name:str,
                ty:"Rom",
                val:rom0.id,
                color:color0
            }]);
            jumpAccordSTATUS();
        });
        buttonDiv.appendChild(document.createElement('br'));
        getButton('#fff','直接修改房间信息',()=>{
            showEditor(Loc0);
            jumpAccordSTATUS();
        });
    }
    
    function getButton(color,name,lamda,attach=true){
        let newButton=document.createElement('button');
        newButton.setAttribute('class','moveButton');
        newButton.textContent=name;
        newButton.style.border=`1px solid ${color}`;
        newButton.style.color=color;
        newButton.addEventListener('click',lamda);
        if(attach){
            let buttonDiv=document.getElementById('buttonDiv');
            buttonDiv.appendChild(newButton);
        }
        return newButton;
    }

    

    function switchRoundMode(player){
        STATUS.ty='round';
        STATUS.val=player;
        createG();
        drawPlayers([player],"#00000000");
        renderAllLayers(player);
        copySvgAsPngToClipboard(document.getElementById('carrier'));
        let info=document.getElementById('info');
        info.innerHTML=`图片已复制到剪贴板，将它发送给${player.name}吧。`;
        let buttonDiv=document.getElementById('buttonDiv');
        buttonDiv.innerHTML='';
        let ruleDiv=document.getElementById('rule1');
        ruleDiv.innerHTML='';
        LocMaskEvent([
            {
                ty: 'click',
                lamda: (Locid,poly0) => {
                    return ()=>{
                        let lastStep=player.stpData.length?player.stpData[player.stpData.length-1]:null;
                        //console.log(lastStep);
                        if(lastStep&&lastStep.ty=="Go"&&lastStep.val==Locid){
                            if(player.stpData.length)player.stpData.pop();
                            player.stpData.push({ty:"Loc",val:Locid});
                        }
                        else if(lastStep&&lastStep.ty=="Loc"&&lastStep.val==Locid){
                            if(player.stpData.length)player.stpData.pop();
                            player.stpData.push({ty:"Rom",val:mapMap.Locs.find((ele)=>ele.id==Locid).rom});
                        }
                        else if(lastStep&&lastStep.ty=="Rom"&&lastStep.val==mapMap.Locs.find((ele)=>ele.id==Locid).rom){
                            if(player.stpData.length)player.stpData.pop();
                        }
                        else{
                            player.stpData.push({ty:"Go",val:Locid});
                        }
                        let Loc0=mapMap.Locs.find((ele)=>ele.id==Locid);
                        defaultLocMaskAction(Loc0);
                    }
                }
            }
        ]);

        getButton('#fff','返回',()=>{
            switchNormalMode();
        });

        let playerind=mapMap.Players.indexOf(player);

        console.log(playerind);

        let lp=null,rp=null;
        for(let i=playerind-1;i>=0;i--){
            if(!mapMap.Players[i].dead){
                lp=mapMap.Players[i];
                break;
            }
        }
        for(let i=playerind+1;i<mapMap.Players.length;i++){
            if(!mapMap.Players[i].dead){
                rp=mapMap.Players[i];
                break;
            }
        }

        if(rp)getButton('#fff',`${rp.name}→`,()=>{
            switchRoundMode(rp);
        });

        if(lp)getButton('#fff',`←${lp.name}`,()=>{
            switchRoundMode(lp);
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton('#fff','撤销',()=>{
            if(player.stpData.length)player.stpData.pop();
            switchRoundMode(player);
        });

        getButton('#fff','移位',()=>{
            let str=prompt('请输入位置或房间名。可以输入简称。');
            if(!str)return;
            let result=getLocorRom(str);
            console.log(result);
            if(!result)return;
            player.stpData=[];
            if(result.ty=="Loc"){
                player.Loc=result.val;
            }
            else if(result.ty=="Rom"){
                player.Loc=mapMap.Locs.find((ele)=>ele.rom==result.val).id;
            }
            switchRoundMode(player);
        });

        getButton('#fff','停留',()=>{
            player.stpData.push({ty:"Stay",val:null});
            switchRoundMode(player);
        });

        getButton('#fff','击杀',()=>{
            killPlayer(player);
            switchNormalMode();
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton('#fff','加步数',()=>{
            player.steps++;
            jumpAccordSTATUS();
        });
        getButton('#fff','减步数',()=>{
            player.steps--;
            jumpAccordSTATUS();
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton('#fff','标记位置为不可通过',() => {
            let str=prompt('请输入位置编号或房间名。可以输入简称。');
            if(!str)return;
            let rom0=getLocorRom(str);
            if(!player.avoid){
                player.avoid=[];
            }
            let index=player.avoid.findIndex((ele)=>ele==rom0);
            if(index!=-1)player.avoid.splice(index,1);
            else player.avoid.push(rom0);
            jumpAccordSTATUS();
        });
        ModsStependEvent();
    }
    function LocMaskEvent(list){
        let g=document.getElementById(`gMask`);
        g.innerHTML='';
        if(!list)return;
        let polys=document.querySelectorAll('svg .LocPolygon');
        let polyMask=[];
        polys.forEach(poly => {
            let poly0=document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            poly0.setAttribute('points',poly.getAttribute('points'));
            poly0.setAttribute('fill','#fff');
            poly0.setAttribute('fill-opacity',0);
            poly0.setAttribute('id',`mask${poly.id}`);
            poly0.setAttribute('stroke','none');
            poly0.setAttribute('tag0',poly.getAttribute('data-index'));
            g.appendChild(poly0);
            polyMask.push(poly0);
        });
        polyMask.forEach(poly=>{
            //console.log(poly.getAttribute('tag0'));
            let Locid=parseInt(poly.getAttribute('tag0'));
            let poly0=document.getElementById(`pLoc${Locid}`);
            list.forEach((ele)=>{
                poly.addEventListener(ele.ty,ele.lamda(Locid,poly0));
            });
        });
    }

    function reAttriAllPolygons(lis){
        let polys=document.querySelectorAll('svg .LocPolygon');
        polys.forEach(poly => {
            lis.forEach((ele)=>{
                poly.setAttribute(ele.attri,ele.lamda(poly.getAttribute('data-index')));
            });
        });
    }

    function isNum(value) {
        return !isNaN(parseFloat(value)) && !isNaN(value);
    }

    function isSubseq(str,subseq){
        let i=0,j=0;
        while(i<str.length&&j<subseq.length){
            if(str[i]==subseq[j])j++;
            i++;
        }
        return j==subseq.length;
    }

    function getLocorRom(str){
        if(isNum(str)){
            let loc0=parseInt(str);
            if(mapMap.Locs.find((ele)=>ele.id==loc0)){
                return {ty:"Loc",val:loc0};
            }
        }
        if(!str.trim())return null;
        let ret=null;
        mapMap.Roms.forEach((rom) => {
            if(isSubseq(rom.name,str)){
                ret={ty:"Rom",val:rom.id};
            }
        });
        return ret;
    }

    function killPlayer(player,type=true){
        console.log(player,type);
        player.dead=type;
        if(type){
            let bc=null;
            if(player.character=="黑影"){
                bc=getbc("deadhy");
            }
            else{
                bc=getbc("dead");
                bc=bc.replaceAll("[player]",player.name);
            }
            broadcast(bc);
            mapMap.items.forEach((item)=>{
                if(item.ty=="Player"&&item.val==player.id&&!item.keepInventory){
                    dropItem(item,player);
                }
            })
        }
    }

    function sortVisdots(){
        mapMap.Locs.forEach((Loc0) => {
            let arr=[];
            mapMap.Players.forEach((ele,i)=>{
                arr[ele.id]=i;
            })
            Loc0.visPlayer=[...new Set(Loc0.visPlayer)].sort((a,b)=>arr[a]-arr[b]);
        });
    }

    function parseColor(str){
        if(isNum(str)){
            let num=parseInt(str);
            if(num>=0&&num<=9){
                return mapMap.COLOR_DEFAULT[parseInt(str)];
            }
            else{
                return null;
            }
        }
        else{
            if(isValidCSSColor(str))return str;
            else return null;
        }
    }

    function getColor(){
        let str=prompt('请输入颜色编码。也可以输入默认颜色编号。');
        if(!str)return;
        let color0=parseColor(str);
        return color0;
    }

    function switchMoveMode(player,dontLeave,drawcircle=true){
        if(player.dead){
            killPlayer(player,false);
            switchMoveMode(player);
            return;
        }
        if(STATUS.ty=='move'&&STATUS.val.id==player.id&&!dontLeave){
            switchRoundMode(player);
            return;
        }
        STATUS.ty="move";
        STATUS.val=player;
        createG();
        renderAllLayers();
        if(drawcircle)createShrinkingCircle(player);

        let info=document.getElementById('info');
        info.innerHTML=`正在操作${player.name}。`
        info.style.color=tinycolor.mix(player.color,'#fff',50);
        
        let buttonDiv=document.getElementById('buttonDiv');
        buttonDiv.innerHTML='';

        let ruleDiv=document.getElementById('rule1');
        ruleDiv.innerHTML='';

        getButton(tinycolor.mix(player.color,'#fff',50),'返回',()=>{
            switchNormalMode();
        });

        getButton(tinycolor.mix(player.color,'#fff',50),'撤销',()=>{
            if(player.stpData.length)player.stpData.pop();
            switchMoveMode(player,true);
        });

        getButton(tinycolor.mix(player.color,'#fff',50),'停留',()=>{
            player.stpData.push({ty:"Stay",val:null});
            switchMoveMode(player,true);
        });

        getButton(tinycolor.mix(player.color,'#fff',50),'移位',()=>{
            let str=prompt('请输入位置或房间名。可以输入简称。');
            if(!str)return;
            let result=getLocorRom(str);
            console.log(result);
            if(!result)return;
            player.stpData=[];
            if(result.ty=="Loc"){
                player.Loc=result.val;
            }
            else if(result.ty=="Rom"){
                player.Loc=mapMap.Locs.find((ele)=>ele.rom==result.val).id;
            }
            switchMoveMode(player,true);
        });

        getButton(tinycolor.mix(player.color,'#fff',50),'击杀',()=>{
            killPlayer(player);
            switchNormalMode();
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton(tinycolor.mix(player.color,'#fff',50),'改名',()=>{
            let str=prompt('请输入文本。');
            if(!str)return;
            str=str.trim();
            if(!str)return;
            player.name=str;
            switchMoveMode(player,true);
        });

        getButton(tinycolor.mix(player.color,'#fff',50),'换色',()=>{
            let color0=getColor();
            if(!color0)return;
            player.color=color0;
            switchMoveMode(player,true);
        });

        getButton(tinycolor.mix(player.color,'#fff',50),'加标记',()=>{
            let str=prompt('请输入物品名。');
            if(!str)return;
            str=str.trim();
            if(!str)return;
            let color0=getColor();
            if(!color0)return;
            addItems([{
                name:str,
                ty:"Player",
                val:player.id,
                color:color0
            }]);
            jumpAccordSTATUS();
        });

        buttonDiv.appendChild(document.createElement('br'));

        getButton(tinycolor.mix(player.color,'#fff',50),'直接修改角色信息',()=>{
            showEditor(player);
            jumpAccordSTATUS();
        });

        LocMaskEvent([
            {
                ty: 'mouseenter',
                lamda: (Locid,poly0) => {
                    return () => {
                        poly0.setAttribute('fill',player.color);
                        poly0.setAttribute('fill-opacity',0.3);
                    }
                }
            },
            {
                ty: 'mouseleave',
                lamda: (Locid,poly0) => {
                    return () => {
                        poly0.setAttribute('fill','none');
                    }
                }
            },
            {
                ty: 'click',
                lamda: (Locid,poly0) => {
                    return ()=>{
                        let lastStep=player.stpData.length?player.stpData[player.stpData.length-1]:null;
                        //console.log(lastStep);
                        if(lastStep&&lastStep.ty=="Go"&&lastStep.val==Locid){
                            if(player.stpData.length)player.stpData.pop();
                            player.stpData.push({ty:"Loc",val:Locid});
                        }
                        else if(lastStep&&lastStep.ty=="Loc"&&lastStep.val==Locid){
                            if(player.stpData.length)player.stpData.pop();
                            player.stpData.push({ty:"Rom",val:mapMap.Locs.find((ele)=>ele.id==Locid).rom});
                        }
                        else if(lastStep&&lastStep.ty=="Rom"&&lastStep.val==mapMap.Locs.find((ele)=>ele.id==Locid).rom){
                            if(player.stpData.length)player.stpData.pop();
                        }
                        else{
                            player.stpData.push({ty:"Go",val:Locid});
                        }
                        switchMoveMode(player,true,false);
                    }
                }
            }
        ]);
        ModsStependEvent();
        // let info=document.getElementById("info-content");
        // info.innerHTML='你正在操作'+player.name+'，点击其所在房间撤销行动，点击其他房间进行移动。';
        // let color0=tinycolor.mix(player.color,'#fff',50);
        // info.style.color=color0;
    }

    function createShrinkingCircle(player) {
        let cir=document.getElementById(`circlePlayer${player.id}`);
        if(!cir)return;

        // 读取圆心坐标
        const cx = cir.cx.baseVal.value;
        const cy = cir.cy.baseVal.value;
        const r = cir.r.baseVal.value;

        // 创建动画圆
        const svg = document.getElementById('mainsvg');
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
        circle.setAttribute('r', r*30);            // 初始半径
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke',player.color);
        circle.setAttribute('stroke-width', 3);
        circle.setAttribute('class', "shrinkingCircle");
        svg.appendChild(circle);

        // 动画参数
        const duration = 600; // 毫秒
        const startR = r*30;
        const startTime = performance.now();

        function shrink(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1); // 0 → 1
            const newR = startR * (Math.exp(-progress*Math.log(30)));

            circle.setAttribute('r', newR);

            if (progress < 1) {
                requestAnimationFrame(shrink);
            } else {
                circle.remove(); // 动画结束移除元素
            }
        }

        requestAnimationFrame(shrink);
    }

    let mapIcon=new Map();

    function initIcon() {
        return fetch('icons/icons.json')
            .then(response => response.json())
            .then(icons => {
                console.log('已加载icons', icons);
                const svgPromises = icons.rom.map(rom => {
                    return fetch(`icons/rom${rom}.svg`)
                        .then(response => response.text())
                        .then(svgText => {
                            let icon0 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                            const uniqueId = '_' + RANDOM().toString(36);
                            svgText = svgText.replace(/(id="|url\(#|href="#)([^"]+?)(["\)])/g, 
                                (match, prefix, id, suffix) => `${prefix}${id}${uniqueId}${suffix}`);
                            icon0.innerHTML = svgText.replaceAll('fill:#221815', 'fill:#ffffff33');
                            icon0.setAttribute('width', '60');
                            icon0.setAttribute('height', '60');
                            const svg1 = icon0.getElementsByTagName('svg')[0];
                            svg1.setAttribute('width', '60');
                            svg1.setAttribute('height', '60');
                            mapIcon.set(rom, svg1);
                        })
                        .catch(error => {
                            console.warn(`加载图标 rom${rom}.svg 失败`, error);
                        });
                });
                return Promise.all(svgPromises);
            })
            .catch(error => {
                console.error('加载 icons.json 失败', error);
                return Promise.reject(error);
            });
    }

    function getRoundColor(round){
        return hsv2rgb(360/14*round,0.4,1);
    }

    function drawRoundInfo(){
        let roundInfo=document.createElementNS('http://www.w3.org/2000/svg', 'text');
        roundInfo.setAttribute('x', 50);
        roundInfo.setAttribute('y', 25);
        roundInfo.setAttribute('fill',getRoundColor(mapMap.Round));
        roundInfo.setAttribute('font-size', '18px');
        roundInfo.setAttribute('text-anchor', 'left');
        roundInfo.setAttribute('dominant-baseline', 'central');
        roundInfo.setAttribute('id', 'roundInfo');
        if(mapMap.Round>=0)roundInfo.textContent=`第 ${mapMap.Round} 回合主持判定时间`;
        if(mapMap.Round==-1)roundInfo.textContent=`游戏开始状态`;
        if(mapMap.Round==-2)roundInfo.textContent=`请继续`;
        let svg=document.getElementById('carrier');
        svg.appendChild(roundInfo);
    }

    function drawPlayerInfo(name, steps){
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 30);
        text.setAttribute('y', 25);
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', '18');
        text.setAttribute('text-anchor', 'left');
        text.setAttribute('dominant-baseline', 'central');

        const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan1.textContent = name;
        tspan1.setAttribute('font-size', '18');
        tspan1.setAttribute('fill', mapMap.COLOR_DEFAULT[8]);
        text.appendChild(tspan1);

        const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan2.textContent = ' 的回合 还有';
        text.appendChild(tspan2);

        const tspan3 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan3.textContent = ` ${steps} `;
        tspan3.setAttribute('font-size', '36');
        tspan3.setAttribute('fill', mapMap.COLOR_DEFAULT[8]);
        text.appendChild(tspan3);

        // 普通文本
        const tspan4 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan4.textContent = '步';
        text.appendChild(tspan4);

        const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text2.setAttribute('x', 30);
        text2.setAttribute('y', mapMap.height+55);
        text2.setAttribute('fill', '#fff');
        text2.setAttribute('font-size', '18');
        text2.setAttribute('text-anchor', 'left');
        text2.setAttribute('dominant-baseline', 'central');

        const tspan21 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan21.textContent = '现在是第';
        tspan21.setAttribute('font-size', '18');
        text2.appendChild(tspan21);

        const tspan22 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan22.textContent = ` ${mapMap.Round} `;
        tspan22.setAttribute('font-size', '36');
        tspan22.setAttribute('fill', mapMap.COLOR_DEFAULT[8]);
        text2.appendChild(tspan22);

        const tspan23 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan23.textContent = ' 回合';
        tspan23.setAttribute('font-size', '18');
        text2.appendChild(tspan23);

        let carrier=document.getElementById('carrier');
        carrier.appendChild(text);
        carrier.appendChild(text2);
    }

    function drawMateInfo(player,stp0){
        let mates=[];
        mapMap.Players.forEach((player0)=>{
            if(player0.dead)return;
            if(player0.id==player.id)return;
            if(player0.Loclast!=player.Loclast)return;
            let stpUsed=0;
            player0.stpData.forEach((stp) => {stpUsed+=stp.stp?stp.stp:1;});
            let stpRem=Math.max(player0.steps-stpUsed,0);
            console.log(stp0,stpRem);
            if((stp0==0&&stpRem==0)||(stp0==player.steps&&stpRem==player0.steps)){
                mates.push(player0.name);
            }
        })
        if(mates.length==0)return;
        const text2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text2.textContent=`你与${mates.join('、')}在同一房间！`;
        text2.setAttribute('x', 400);
        text2.setAttribute('y', mapMap.height+55);
        text2.setAttribute('fill', mapMap.COLOR_DEFAULT[5]);
        text2.setAttribute('font-size', '14');
        text2.setAttribute('text-anchor', 'middle');
        text2.setAttribute('dominant-baseline', 'central');
        carrier.appendChild(text2);
        console.log(text2);
    }

    function caculateDis(LocId,avoids=[],stpRem){
        let avoidmap=new Map();
        avoids.forEach((avoided) => {
            let loc=null;
            if(avoided.ty=="Loc")loc=avoided.val;
            if(avoided.ty=="Rom")loc=mapMap.Locs.find((ele)=>ele.rom==avoided.val).id;
            avoidmap.set(loc,true);
        });
        initDoor();
        let dis=new Map();
        let visited=new Set();
        let queue=[LocId];
        dis.set(LocId,0);
        visited.add(LocId);
        while(queue.length>0){
            let current=queue.shift();
            if(avoidmap.has(current))continue;
            mapMap.Locs.forEach((loc0)=>{
                if(avoidmap.has(loc0.id))return;
                let door0=getDoor(current,loc0.id);
                if(!door0)return;
                let discur=dis.get(current);
                if(stpRem!==null){
                    if(door0.disabled&&discur<stpRem)return;
                    if(door0.isExtra&&discur>=stpRem)return;
                }
                if(!visited.has(loc0.id)){
                    visited.add(loc0.id);
                    dis.set(loc0.id,discur+1);
                    queue.push(loc0.id);
                }
            });
        }
        return dis;
    }

    function mechanAct(){
        mapMap.items.forEach((item) => {
            if(item.result)item.result(item);
        })
    }
    
    function nextRound(){
        let carrier=document.getElementById('carrier');
        copySvgAsPngToClipboard(carrier);
        saveMap(`R${mapMap.Round}`);
        saveGame();
        mapMap.Players.forEach((player) => {
            let Loc0=player.Loc;
            mapMap.Locs.find((loc) => loc.id == Loc0).visPlayer.push(player.id);
            player.stpData.forEach((stp) => {
                if(stp.ty=="Go"){
                    Loc0=stp.val;
                }
                if(stp.ty=="Loc"){
                    Loc0=stp.val;
                }
                if(stp.ty=="Rom"){
                    Loc0=mapMap.Locs.find((ele)=>ele.rom==stp.val).id;
                }
                mapMap.Locs.find((loc) => loc.id == Loc0).visPlayer.push(player.id);
            });
            player.Loc=player.Loclast;
            player.stpData=[];
        });
        sortVisdots();
        mechanAct();
        ModsRoundendEvent();
        mapMap.items.forEach((item) => {
            item.used=null;
        });
        showBroadcasts();
        let bd1=document.getElementById('bd1');
        saveReplay(mapMap.Round,carrier,bd1);
        mapMap.Round++;
        bd1.innerHTML="";
        switchNormalMode();
    }

    function renderAllLayers(player) {

        initDoor();
        
        let gMap=document.getElementById('gMap');
        
        gMap.innerHTML='';
        

        //console.log(svg);

        function drawLocPolygon(Loc0){
            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = Loc0.vertices.map(v => `${v[0]},${v[1]}`).join(' ');
            polygon.setAttribute('points', points);
            polygon.setAttribute('data-index', Loc0.id);
            polygon.setAttribute('fill', 'none');
            polygon.setAttribute('stroke', '#ccc');
            polygon.setAttribute('stroke-width', '2px');
            polygon.setAttribute('class', 'LocPolygon');
            polygon.setAttribute('id',`pLoc${Loc0.id}`)
            gMap.appendChild(polygon);
        }

        function drawIcon(Loc0){
            if(Loc0.rom&&mapIcon.has(Loc0.rom)){
                let svgIcon=mapIcon.get(Loc0.rom).cloneNode(true);
                svgIcon.setAttribute('x', Loc0.center[0]-30);
                svgIcon.setAttribute('y', Loc0.center[1]-30);
                gMap.appendChild(svgIcon);
            }
        }

        function drawLocId(Loc0,color=mapMap.COLOR_DEFAULT[9]){
            const textLid=document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textLid.setAttribute('x', Loc0.center[0]-24);
            textLid.setAttribute('y', Loc0.center[1]-20);
            textLid.setAttribute('fill', color);
            textLid.setAttribute('font-size', '8px');
            textLid.setAttribute('text-anchor', 'center');
            textLid.setAttribute('dominant-baseline', 'middle');
            //textLid.setAttribute('user-select', 'none');
            textLid.textContent=Loc0.id;
            gMap.appendChild(textLid);
        }

        function drawBigLocId(Loc0){
            const textLid=document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textLid.setAttribute('x', Loc0.center[0]);
            textLid.setAttribute('y', Loc0.center[1]+2);
            textLid.setAttribute('fill', '#ffffff33');
            textLid.setAttribute('font-size', '25px');
            textLid.setAttribute('text-anchor', 'middle');
            textLid.setAttribute('dominant-baseline', 'middle');
            textLid.textContent=Loc0.id;
            gMap.appendChild(textLid);
        }

        function drawRomName(Loc0,color='#ccc'){
            const textRom=document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textRom.setAttribute('x', Loc0.center[0]);
            textRom.setAttribute('y', Loc0.center[1]);
            textRom.setAttribute('fill', color);
            textRom.setAttribute('font-size', '7px');
            textRom.setAttribute('text-anchor', 'middle');
            textRom.setAttribute('dominant-baseline', 'middle');
            //textRom.setAttribute('user-select', 'none');
            textRom.textContent=mapMap.Roms.find((ele)=>ele.id==Loc0.rom).name;
            gMap.appendChild(textRom);
        }

        function drawVisDots(Loc0){
            let len=Loc0.visPlayer.length;
            if(len>0){
                let i=0;
                
                Loc0.visPlayer.forEach((playerId) => {
                    //console.log(playerId);
                    i++;
                    let dot0 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    let xd=Math.min(35/len,4)*(len-i);
                    dot0.setAttribute('x', Loc0.center[0]+22-xd);
                    dot0.setAttribute('y', Loc0.center[1]-22);
                    dot0.setAttribute('fill', mapMap.Players.find((ele)=>ele.id==playerId).color);
                    dot0.setAttribute('font-size', '8px');
                    dot0.setAttribute('font-weight', 'bold');
                    dot0.setAttribute('text-anchor', 'center');
                    dot0.setAttribute('dominant-baseline', 'central');
                    dot0.textContent='\\';
                    gMap.appendChild(dot0);
                });
            }
        }
        function drawDis(Loc0,Dis){
            const textDis=document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textDis.setAttribute('x', Loc0.center[0]+20);
            textDis.setAttribute('y', Loc0.center[1]-20);
            textDis.setAttribute('fill', '#ffffff88');
            textDis.setAttribute('font-size', '8px');
            textDis.setAttribute('text-anchor', 'middle');
            textDis.setAttribute('dominant-baseline', 'middle');
            textDis.textContent=`(${Dis})`;
            gMap.appendChild(textDis);
        }

        let itemLocs=new Map();
        if(player){
            mapMap.Locs.forEach((Loc0) => {
                drawLocPolygon(Loc0);
                let poly0=document.getElementById(`pLoc${Loc0.id}`);
                poly0.setAttribute('stroke', '#fff');
            });
            let stpUsed=0;
            player.stpData.forEach((stp) => {stpUsed+=stp.stp?stp.stp:1;});
            let stpRem=Math.max(player.steps-stpUsed,0),dis0=caculateDis(player.Loclast,player.avoid,stpRem);
            mapMap.Locs.forEach((Loc0) => {
                if(dis0.has(Loc0.id)){
                    let disVal=Math.max(0,stpRem+1-dis0.get(Loc0.id));
                    let poly0=document.getElementById(`pLoc${Loc0.id}`);
                    let color0=Loc0.visPlayer.find((id) => id === player.id)?mapMap.COLOR_DEFAULT[9]:"#aaa";
                    poly0.setAttribute('fill', color0);
                    poly0.setAttribute('fill-opacity', (disVal)/(stpRem+1));
                }
            });
            let stpUsed0=0;
            if(!itemLocs.has(player.Loc))itemLocs.set(player.Loc,"visited");
            let poly0=document.getElementById(`pLoc${player.Loc}`);
            poly0.setAttribute('fill', '#d70');
            poly0.setAttribute('fill-opacity', 1/(stpUsed+1));
            player.stpData.forEach((stp) => {
                stpUsed0+=stp.stp?stp.stp:1;
                let Locloc;
                if(stp.ty=="Go"){
                    if(!itemLocs.has(stp.val))itemLocs.set(stp.val,"visited");
                    Locloc=stp.val;
                }
                if(stp.ty=="Loc"){
                    if(!itemLocs.has(stp.val))itemLocs.set(stp.val,"found");
                    Locloc=stp.val;
                }
                if(stp.ty=="Rom"){
                    let Loc0=mapMap.Locs.find((ele)=>ele.rom==stp.val);
                    if(!itemLocs.has(Loc0.id))itemLocs.set(Loc0.id,"found");
                    Locloc=Loc0.id;
                }
                let poly0=document.getElementById(`pLoc${Locloc}`);
                if(poly0){
                    let color0=stp.ty=="Go"?mapMap.COLOR_DEFAULT[8]:(stp.ty=="Loc"?mapMap.COLOR_DEFAULT[5]:mapMap.COLOR_DEFAULT[7]);
                    let opacity0=stp.ty=="Go"?(stpUsed0+1)/(stpUsed+1)*0.9:0.5;
                    poly0.setAttribute('fill', color0);
                    poly0.setAttribute('fill-opacity', opacity0);
                    //console.log(stpUsed0,stpUsed);
                }
            });
            mapMap.Locs.forEach((Loc0) => {
                let found = Loc0.visPlayer.find((id) => id === player.id)||itemLocs.get(Loc0.id);
                if(found){
                    drawIcon(Loc0);
                    drawLocId(Loc0,"#fff");
                    drawRomName(Loc0,"#fff");
                    if(!itemLocs.has(Loc0.id))itemLocs.set(Loc0.id,"found");
                }
                else{
                    drawBigLocId(Loc0);
                }
                drawDis(Loc0,dis0.has(Loc0.id)?dis0.get(Loc0.id):"X");
            });
            //drawPlayers([player],'#ffffff88');

            drawDoor(player,dis0,stpRem);

            drawPlayerInfo(player.name, stpRem);

            drawMateInfo(player,stpRem);

            drawItems(itemLocs);
        }
        else{
            mapMap.Locs.forEach((Loc0) => {
                drawLocPolygon(Loc0);

                drawIcon(Loc0);

                drawLocId(Loc0);

                drawRomName(Loc0);

                drawVisDots(Loc0);
                itemLocs.set(Loc0.id,"visited");
            });
            drawNames();

            drawPlayers();

            drawRoundInfo();

            mapMap.Doors.forEach((door) => {
                if(STATUS.ty=='normal')return;
                let da=door.Loc1,db=door.Loc2;
                if(da==STATUS.val.Loclast||db==STATUS.val.Loclast){
                    let path=getPath(door.Loc1,door.Loc2);
                    path.setAttribute('stroke', STATUS.val.color);
                    path.setAttribute('stroke-width', 8);
                    path.setAttribute('stroke-opacity',0.3);
                    path.setAttribute('fill', 'none');
                    gMap.appendChild(path);
                }
            });

            drawDoor();

            drawItems(itemLocs);
        }
    }

    function jumpAccordSTATUS(){
        if(STATUS.ty=='move'){
            switchMoveMode(STATUS.val,true,false);
        }
        if(STATUS.ty=='round'){
            switchRoundMode(STATUS.val);
        }
        if(STATUS.ty=='normal'){
            switchNormalMode();
        }
    }

    

    // ----- 添加：物品动画相关变量 -----
    let itemsToAnimate = [];
    let animFrameId = null;

    function pickItem(item,player){
        item.oldTy=item.ty;
        item.ty='Player';
        item.val=player.id;
    }

    function dropItem(item,player){
        item.ty=item.oldTy||"Rom";
        if(item.ty=="Loc"){
            item.val=player.Loclast;
        }
        else{
            item.val=mapMap.Locs.find((ele)=>ele.id==player.Loclast).rom;
        }
    }

    
    

    function deleteItem(item){
        let ind=mapMap.items.indexOf(item);
        console.log('删除物品', item, ind);
        if(ind>=0)mapMap.items.splice(ind,1);
    }

    

    function moveItem(item){
        let str=prompt('请输入位置或房间名。可以输入简称。');
        if(!str)return;
        let result=getLocorRom(str);
        console.log(result);
        if(!result)return;
        if(result.ty=='Loc'&&item.ty=='Rom'){
            result.val=mapMap.Locs.find((ele)=>ele.id==result.val).rom;
        }
        if(result.ty=='Rom'&&item.ty=='Loc'){
            result.val=mapMap.Locs.find((ele)=>ele.rom==result.val).id;
        }
        item.val=result.val;
    }

    function getItemActual(item,ty){
        if(ty=='Loc'){
            if(item.ty=="Loc")return item.val;
            if(item.ty=="Rom")return mapMap.Locs.find((ele)=>ele.rom==item.val).id;
            if(item.ty=="Player"){
                let pla=mapMap.Players.find((ele)=>ele.id==item.val);
                return pla.Loclast;
            }
        }
        if(ty=='Rom'){
            let Loc=getItemActual(item,"Loc");
            return mapMap.Locs.find((ele)=>ele.id==Loc).rom;
        }
    }

    function drawItems(Locs,selected) {
        //console.log('绘制物品', Locs);
        const svg = document.getElementById('gItem');
        svg.innerHTML="";

        // 停止之前的动画并移除旧元素
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        itemsToAnimate = [];

        // 按房间分组物品
        const itemsToDraw = new Map();
        mapMap.items.forEach(item => {
            // const locId = item.Loc;
            // if(!Locs.has(locId))return;
            // //console.log(item.name,locId,Locs.get(locId));
            // if(!item.alwayVisibie&&Locs.get(locId)!="visited")return;
            // if(!itemsByLoc.has(locId)) itemsByLoc.set(locId, []);
            // itemsByLoc.get(locId).push(item);
            switch (item.ty) {
                case 'Loc':{
                    const locId = item.val;
                    if(!Locs.has(locId))return;
                    if(!item.alwayVisibie&&Locs.get(locId)!="visited")return;
                    let lis0=`Loc ${locId}`;
                    if(!itemsToDraw.has(lis0)) itemsToDraw.set(lis0, []);
                    itemsToDraw.get(lis0).push(item);
                    break;
                }
                case 'Rom':{
                    const locId = mapMap.Locs.find((ele)=>ele.rom==item.val).id;
                    if(!Locs.has(locId))return;
                    if(!item.alwayVisibie&&Locs.get(locId)!="visited")return;
                    let lis0=`Loc ${locId}`;
                    if(!itemsToDraw.has(lis0)) itemsToDraw.set(lis0, []);
                    itemsToDraw.get(lis0).push(item);
                    break;
                }
                case 'Player':{
                    let pId=item.val;
                    if(STATUS.ty=="round"&&pId!=STATUS.val.id)return;
                    let lis0=`Player ${pId}`;
                    if(!itemsToDraw.has(lis0)) itemsToDraw.set(lis0, []);
                    itemsToDraw.get(lis0).push(item);
                    break;
                }
            }
        });

        for (let [type, itemList] of itemsToDraw.entries()) {
            //console.log(type, itemList);
            let ttype=type.split(' ');
            let center=[0,0];
            switch (ttype[0]) {
                case 'Loc':{
                    let center0=mapMap.Locs.find((ele)=>ele.id==ttype[1]).center;
                    center = [center0[0],center0[1]+40];
                    break;
                }
                case 'Player':{
                    center = mapMap.Players.find((ele)=>ele.id==ttype[1]).center;
                    break;
                }
            }
            const [cx, cy] = center;
            const count = itemList.length;
            itemList.forEach((item, index) => {
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

                let r=1;
                let wid0=0.8;
                if(item.id==selected)r=2;
                let color00=item.color;


                g.setAttribute('class', 'item-group');
                if(item.type=="机关"){
                    if(item.used){
                        color00=item.used.color||"#fff";
                        if(STATUS.ty=="round"){
                            color00="#fff";
                        }
                        wid0=1.2;
                        r=r*1.2
                    }
                    const hexagon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    hexagon.setAttribute('points', createPolygon(6,13*r));
                    hexagon.setAttribute('fill', '#000000cc');
                    hexagon.setAttribute('stroke', color00);
                    hexagon.setAttribute('stroke-width', wid0);
                    hexagon.setAttribute('class', 'item-back');
                    g.appendChild(hexagon);
                }
                else{
                    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    circle.setAttribute('r', 10*r);
                    circle.setAttribute('fill', '#000000cc');
                    circle.setAttribute('stroke', color00);
                    circle.setAttribute('stroke-width', wid0);
                    circle.setAttribute('class', 'item-back');
                    g.appendChild(circle);
                }

                // 文本
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('fill', color00);
                let siz0=Math.min(7,30/item.size);
                text.setAttribute('font-size', `${siz0}px`);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'central');
                text.setAttribute('pointer-events', 'none');
                text.textContent = item.name;
                g.appendChild(text);

                g.addEventListener('mouseenter', ()=>{
                    g.querySelector('.item-back').setAttribute('fill', '#666666cc');
                });

                g.addEventListener('mouseleave', ()=>{
                    g.querySelector('.item-back').setAttribute('fill', '#000000cc');
                });

                if(item.id==selected){
                    let color0=tinycolor.mix(item.color, '#fff', 50)
                    let info=document.getElementById('info');
                    let buttonDiv=document.getElementById('buttonDiv');
                    buttonDiv.innerHTML='';
                    if(item.info){
                        item.info(item);
                    }
                    info.style.color=color0;
                    let ruleDiv=document.getElementById('rule1');
                    let rule0=rulesMap.get(item.name);
                    if(rule0){
                        ruleDiv.innerHTML=rule0.val;
                    }
                    else{
                        ruleDiv.innerHTML='';
                    }
                    if(item.ty!='Player')getButton(color0,"移位",()=>{
                        moveItem(item);
                        drawItems(Locs);
                    })
                    getButton(color0,"删除",()=>{
                        deleteItem(item);
                        jumpAccordSTATUS();
                    });
                    getButton(color0,"返回",()=>{
                        jumpAccordSTATUS();
                    });
                    buttonDiv.appendChild(document.createElement('br'));
                    getButton(color0,'直接修改道具信息',()=>{
                        showEditor(item);
                        jumpAccordSTATUS();
                    });
                    g.addEventListener('click', ()=>{
                        if(item.click){
                            item.click(item);
                        }
                        if(STATUS.ty!='round'){
                            drawPlayers();
                        }
                        else{
                            drawPlayers([STATUS.val],"#00000000");
                        }
                        jumpAccordSTATUS();
                    });
                }
                else{
                    g.addEventListener('click', ()=>{
                        drawItems(Locs,item.id);
                    });
                }

                // 保存动画数据
                if(ttype[0]=='Loc'){
                    const offset = (index * 2 * Math.PI) / count;
                    const elapsed = performance.now() / 6000;
                    const angleSpeed = 2 * Math.PI; 
                    const angle = offset + angleSpeed * elapsed;
                    const x = cx + 25 * Math.cos(angle);
                    const y = cy + 25 * Math.sin(angle);
                    const polygon = g.querySelector('polygon');
                    if(polygon){
                        polygon.setAttribute('transform', `rotate(${angle * 35})`);
                    }
                    if(polygon&&item.destXY){
                        //console.log(vertices);
                        for (let i = 0; i < 6; i++) {
                            let r0 = 13*r;
                            let x0 = cx+25*Math.cos(angle)+r0*Math.cos((angle*35+60*i)*Math.PI/180);
                            let y0 = cy+25*Math.sin(angle)+r0*Math.sin((angle*35+60*i)*Math.PI/180);
                            let destX = item.destXY[0];
                            let destY = item.destXY[1]+40;
                            //console.log(x0,y0);
                            let line0=document.createElementNS('http://www.w3.org/2000/svg', 'line');
                            line0.setAttribute('x1', x0);
                            line0.setAttribute('y1', y0);
                            line0.setAttribute('x2', destX);
                            line0.setAttribute('y2', destY);
                            line0.setAttribute('stroke', color00);
                            line0.setAttribute('stroke-width', wid0);
                            line0.setAttribute('data-index', i);
                            line0.setAttribute('class', `mechanline`);
                            itemsToAnimate.push({
                                element: line0,
                                cx: cx,
                                cy: cy,
                                r0: r0,
                                index:i,
                                offset: offset,
                                type: 'mechanline'
                            });
                            svg.appendChild(line0);      
                        }
                    }
                    g.setAttribute('transform', `translate(${x}, ${y})`);
                    itemsToAnimate.push({
                        element: g,
                        cx: cx,
                        cy: cy,
                        offset: offset,
                        type: 'normal'
                    });
                }
                if(ttype[0]=='Player'){
                    if(STATUS.ty!='round'){
                        let x=cx+getMida(-25,25,index+1,count+1);
                        let y=cy+15;
                        g.setAttribute('transform', `translate(${x}, ${y})`);
                    }
                    else {
                        console.log(item);
                        let x=getMida(300,500,index+1,count+1);
                        let y=20;
                        g.setAttribute('transform', `translate(${x}, ${y})`);
                    }
                }
                svg.appendChild(g);
            });
        }

        // 启动动画
        if (itemsToAnimate.length === 0) return;
        function updatePositions(now) {
            const elapsed = now / 6000; // 秒
            const angleSpeed = 2 * Math.PI; // 每秒一圈
            itemsToAnimate.forEach(item => {
                if(item.type=='normal'){
                    const angle = item.offset + angleSpeed * elapsed;
                    const x = item.cx + 25 * Math.cos(angle);
                    const y = item.cy + 25 * Math.sin(angle);
                    item.element.setAttribute('transform', `translate(${x}, ${y})`);
                    const polygon = item.element.querySelector('polygon');
                    if(polygon){
                        polygon.setAttribute('transform', `rotate(${angle * 35})`);
                    }
                }
                else if(item.type=='mechanline'){
                    const angle = item.offset + angleSpeed * elapsed;
                    let x0 = item.cx+25*Math.cos(angle)+item.r0*Math.cos((angle*35+60*item.index)*Math.PI/180);
                    let y0 = item.cy+25*Math.sin(angle)+item.r0*Math.sin((angle*35+60*item.index)*Math.PI/180);
                    item.element.setAttribute('x1', x0);
                    item.element.setAttribute('y1', y0);
                }
            });
            animFrameId = requestAnimationFrame(updatePositions);
        }
        animFrameId = requestAnimationFrame(updatePositions);
    }

    async function initRule() {
        try {
            const response = await fetch('rule.json');
            const rules = await response.json();
            console.log(rules);
            Object.keys(rules.RomRules).forEach((key) => {
                rulesMap.set(key,{
                    type:"Rom",
                    val:rules.RomRules[key],
                });
            });
            Object.keys(rules.itemRules).forEach((key) => {
                rulesMap.set(key,{
                    type:"item",
                    val:rules.itemRules[key],
                });
            });
            return await Promise.resolve(rules);
        } catch (error_1) {
            console.error('加载 rules.json 失败', error_1);
            return await Promise.reject(error_1);
        }
    }

    function getbc(key){
        return mapMap.broadcasts[key];
    }

    function parseTextWithColor(wenben){
        let color0=null;
        wenben=wenben.replace(/\".*?\"/,(match)=>{
            let color1=match.slice(1,-1);
            color0=parseColor(color1);
            return "";
        });
        if(!color0){
            wenben=wenben.replace(/“.*?”/,(match)=>{
                let color1=match.slice(1,-1);
                color0=parseColor(color1);
                return "";
            });
        }
        return [color0,wenben];
    }

    function getbcdiv(wenben,result,deletecolor=true){
        let wenben0=wenben;
        let color=null;
        [color,wenben]=parseTextWithColor(wenben);
        if(!deletecolor)wenben=wenben0;
        color=color||"#fff";
        //console.log(color,wenben);
        let div=document.createElement('div');
        div.setAttribute('class','broadcast');
        let text=document.createElement('p');
        text.innerText=wenben;
        text.style.color=color;
        text.setAttribute('contenteditable',true);
        text.setAttribute('class','bcwenben');
        div.appendChild(text);
        text.addEventListener("click",()=>{
            div.style.opacity=1;
        })
        text.addEventListener("mouseover",()=>{
            if(text!=document.activeElement)div.style.opacity=0.5;
        })
        text.addEventListener("mouseout",()=>{
            div.style.opacity=1;
        })
        //console.log(result(text,div));
        text.addEventListener("blur",result(text,div))
        text.addEventListener("keydown",(e)=>{
            if(e.key=="Enter"){
                text.blur();
            }
        });
        return div;
    }

    function broadcast(wenben){
        let bd = document.getElementById('bd1');
        bd.appendChild(getbcdiv(wenben,(text,div)=>(()=>{
            let str=text.innerText;
            let color0=null;
            [color0,str]=parseTextWithColor(str);
            //console.log(color0,str);
            text.innerText=str;
            if(color0)text.style.color=color0;
            if(!str.trim())div.remove();
        })));
    }

    

    // ----- 弹窗函数：在当前页面内显示广播内容（模态框）-----

    function showBroadcasts() {
    // 如果已经存在弹窗，先移除
        const existing = document.getElementById('broadcastPopupOverlay');
        if (existing) existing.remove();

        const bd1 = document.getElementById('bd1');
        if (!bd1||!bd1.innerHTML.trim()) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'broadcastPopupOverlay';
        overlay.className = 'popup-overlay';

        const popup = document.createElement('div');
        popup.className = 'popup-container';

        const header = document.createElement('div');
        header.className = 'popup-header';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'broadcasts';
        contentDiv.innerHTML = bd1.innerHTML;

        let title = document.createElement('text');
        title.innerText = '请确认本回合广播：';
        title.style.color = '#fff';

        header.appendChild(title);
        popup.appendChild(header);
        popup.appendChild(contentDiv);

        let buttonDiv = document.createElement('div');
        buttonDiv.className = 'popup-buttons';

        let copyButton = document.createElement('button');
        copyButton.innerText = '复制到剪贴板';
        copyButton.addEventListener('click', async() => {
            const textLines = Array.from(contentDiv.querySelectorAll('.broadcast'))
                                   .map(el => el.innerText.trim())
                                   .filter(text => text !== ''); // 过滤掉空行
            const rawText = textLines.join('\n');

            const processedText = eraseBracket(rawText);

            try {
                
                await navigator.clipboard.writeText(processedText);
            } catch (err) {
                console.error('复制到剪贴板失败: ', err);
                alert('无法写入剪贴板，请检查浏览器权限。');
            }
        });

        buttonDiv.appendChild(copyButton);

        const closeButton = document.createElement('button');
        closeButton.innerText = '完成';
        closeButton.setAttribute("id","closeButton");
        closeButton.addEventListener('click', () => {
            overlay.remove();
        });
        buttonDiv.appendChild(closeButton);

        let shuffleButton = document.createElement('button');
        shuffleButton.innerText = '打乱';
        shuffleButton.addEventListener('click', () => {
            const items = contentDiv.querySelectorAll('.broadcast');
            const shuffled = Array.from(items).sort(() => RANDOM() - 0.5);
            shuffled.forEach(item => contentDiv.appendChild(item));
        });

        buttonDiv.appendChild(shuffleButton);

        popup.appendChild(buttonDiv);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        //console.log(overlay);
    };

    // ----- 弹窗函数：编辑 mapMap 的 JSON 数据 -----
    function showEditor(obj0) {
        // 如果已经存在弹窗，先移除
        const existing = document.getElementById('mapDataPopupOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'mapDataPopupOverlay';
        overlay.className = 'popup-overlay';

        const popup = document.createElement('div');
        popup.className = 'popup-container';
        // 为了方便编写代码，稍微调大一点并使用 Flex 布局撑开内部
        popup.style.width = '85%';
        popup.style.maxWidth = '800px';
        popup.style.height = '85%';
        popup.style.display = 'flex';
        popup.style.flexDirection = 'column';

        const header = document.createElement('div');
        header.className = 'popup-header';

        let title = document.createElement('text');
        title.innerText = '请谨慎操作，错误的数据会导致无法预测的后果，建议先进行存档。';
        title.style.color = '#fff';

        header.appendChild(title);
        popup.appendChild(header);

        // 中间内容区使用一个 textarea 作为代码编辑器
        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';
        contentDiv.style.display = 'flex';
        contentDiv.style.padding = '10px';

        const textarea = document.createElement('textarea');
        textarea.style.flex = '1';
        textarea.style.backgroundColor = '#222';
        textarea.style.color = mapMap.COLOR_DEFAULT[9];
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '14px';
        textarea.style.border = '1px solid #555';
        textarea.style.padding = '1px';
        textarea.style.resize = 'none';

        textarea.setAttribute('spellcheck', 'false');       // 禁用拼写检查（去红波浪线）
        textarea.setAttribute('autocomplete', 'off');       // 禁用自动记忆/完成
        textarea.setAttribute('autocorrect', 'off');        // 禁用自动纠错
        textarea.setAttribute('autocapitalize', 'off');
        
        // 将当前的 mapMap 数据转为格式化的 JSON 字符串并放入文本框
        textarea.value = JSON.stringify(obj0, null, 2);

        contentDiv.appendChild(textarea);
        popup.appendChild(contentDiv);

        let buttonDiv = document.createElement('div');
        buttonDiv.className = 'popup-buttons';

        // 保存按钮
        let saveButton = document.createElement('button');
        saveButton.innerText = '保存';
        saveButton.addEventListener('click', () => {
            try {
                // 1. 尝试解析 JSON，如果存在语法错误会自动抛出被 catch 捕获
                let newMapData = JSON.parse(textarea.value);
                
                // 2. 覆盖原有 mapMap 数据
                Object.keys(obj0).forEach(key => delete obj0[key]); // 先清空原对象

                Object.assign(obj0, newMapData);
                
                // 3. 重要：因为 JSON 序列化会丢失函数（比如 items 里的 lamda, info），需要重新绑定
                catchItemAppendFunctions(mapMap.items);
                
                overlay.remove();

                jumpAccordSTATUS();
            } catch (error) {
                // 如果解析失败，弹窗警告并保留原内容以供修改
                alert('语法错误。详情: ' + error.message);
            }
        });

        // 取消按钮
        let cancelButton = document.createElement('button');
        cancelButton.innerText = '取消';
        cancelButton.addEventListener('click', () => {
            overlay.remove();
        });

        buttonDiv.appendChild(saveButton);
        buttonDiv.appendChild(cancelButton);

        popup.appendChild(buttonDiv);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    function saveMap(name) {
        if(!name) name = prompt('请输入存档名。留空则设为默认。');
        if (name === null) return;
        let timestamp = `R${mapMap.Round} ${moment().format('HH:mm:ss(YYYY/MM/DD)')}`;
        let button = document.createElement('div');
        button.setAttribute('title', `${timestamp}`);
        button.setAttribute('class','save-button');
        button.style.color=getRoundColor(mapMap.Round);
        button.style.border=`2px solid ${getRoundColor(mapMap.Round)}`;
        let text = document.createElement('text');
        text.setAttribute('font-size', '20px');
        text.innerText = `${name}`;
        button.appendChild(text);
        button.mapMap=JSON.stringify(mapMap);
        let broadcasts = document.getElementById('bd1');
        button.broadcasts=broadcasts.innerHTML;
        button.addEventListener('click', () => {
            //console.log(button.mapMap);
            loadMap(button.mapMap,button.broadcasts);
        });
        let saves = document.querySelector('.saves');
        saves.appendChild(button);
        //localStorage.setItem('mapData', JSON.stringify(mapMap));
    }

    function loadMap(map0,broadcastss){
        Object.keys(mapMap).forEach(key => delete mapMap[key]);
        Object.assign(mapMap, JSON.parse(map0));
        initMods();
        let broadcasts = document.getElementById('bd1');
        broadcasts.innerHTML=broadcastss;
        broadcasts.querySelectorAll('.broadcast').forEach((div)=>{
            let text=div.querySelector('.bcwenben');
            text.addEventListener("click",()=>{
                div.style.opacity=1;
            })
            text.addEventListener("mouseover",()=>{
                if(text!=document.activeElement)div.style.opacity=0.5;
            })
            text.addEventListener("mouseout",()=>{
                div.style.opacity=1;
            })
            text.addEventListener("blur",()=>{
                let str=text.innerText;
                let color0=null;
                [color0,str]=parseTextWithColor(str);
                //console.log(color0,str);
                text.innerText=str;
                if(color0)text.style.color=color0;
                if(!str.trim())div.remove();
            })
            text.addEventListener("keydown",(e)=>{
                if(e.key=="Enter"){
                    text.blur();
                }
            });
        });
        catchItemAppendFunctions(mapMap.items);
        //console.log(mapMap);
        switchNormalMode();
    }

    async function recoverGame(){

        let saveslis = await new Promise((resolve)=>{
            let trans=DB.transaction(["saves"],"readonly");
            let store=trans.objectStore("saves");
            let req=store.openCursor();
            let lis=[];
            req.onsuccess=function(event){
                let cursor=event.target.result;
                if(cursor){
                    let data=cursor.value;
                    lis.push({id:cursor.key,val:data.val});
                    cursor.continue();
                }
                else{
                    resolve(lis);
                }
            }
        });

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
        contentDiv.innerHTML = bd1.innerHTML;

        popup.appendChild(header);
        popup.appendChild(contentDiv);

        let text1=document.createElement('text');
        text1.innerText="请选择记录来加载：";
        text1.style.color="#fff";
        contentDiv.appendChild(text1);

        let datalistdiv=document.createElement('div');
        datalistdiv.setAttribute('class','modlist');
        saveslis.forEach((data)=>{
            let ddiv=document.createElement('div');
            let alldata=JSON.parse(data.val);
            console.log(data);
            ddiv.innerText=data.id+"-"+alldata.timestamp;
            ddiv.style.color="#fff";
            ddiv.appendChild(getButton("#fff","加载",()=>{
                let saves=document.querySelector('.saves');
                saves.innerHTML="";
                alldata.lis.forEach((li,ind)=>{
                    const parser = new DOMParser();
                    let button=parser.parseFromString(li.html, 'text/html').body.firstChild;
                    button.mapMap=li.map;
                    button.broadcasts=li.bc;    
                    saves.appendChild(button);
                    button.addEventListener('click', () => {
                        loadMap(button.mapMap,button.broadcasts);
                    });
                    if(ind==alldata.lis.length-1){
                        loadMap(button.mapMap,button.broadcasts);
                        let rsddiv=document.querySelector('.randomseed');
                        rsddiv.innerHTML=`随机数种子：${mapMap.seed}`;
                    }
                });
                overlay.remove();
            },false));
            ddiv.appendChild(getButton("#fff","删除",()=>{
                let trans=DB.transaction(["saves"],"readwrite");
                let store=trans.objectStore("saves");
                let req=store.delete(data.id);  
                req.onsuccess=()=>{
                    console.log("删除成功");
                    ddiv.remove();
                    recoverGame();
                }
            },false));
            datalistdiv.appendChild(ddiv);
        });

        contentDiv.appendChild(datalistdiv);

        if (navigator.storage && navigator.storage.estimate) {
            let text2=document.createElement('div');
            text2.style.color="#fff";
            navigator.storage.estimate().then(estimate => {
                console.log(estimate);
                text2.innerText = `已用空间: ${estimate.usage}/${estimate.quota}`;
            });
            contentDiv.appendChild(text2);
        }

        let closeButton = document.createElement('button');
        closeButton.innerText = '返回';
        closeButton.setAttribute("id","closeButton");
        closeButton.addEventListener('click', () => {
            overlay.remove();
        });
        contentDiv.appendChild(closeButton);

        popup.appendChild(contentDiv);

        overlay.appendChild(popup);
        document.body.appendChild(overlay);

        console.log(overlay);
    }

    function saveGame(){
        let lblist=[];
        document.querySelectorAll('.save-button').forEach((button)=>{
            lblist.push({map:button.mapMap,bc:button.broadcasts,html:button.outerHTML});
        });
        let name=mapMap.seed;
        console.log(lblist);
        //localStorage.setItem(name,JSON.stringify({timestamp:moment().format('HH:mm:ss(YYYY/MM/DD)'),lis:lblist}));
        //console.log(localStorage.getItem(name));
        let text=JSON.stringify({timestamp:moment().format('HH:mm:ss(YYYY/MM/DD)'),lis:lblist});
        let trans=DB.transaction(["saves"],"readwrite");
        let store=trans.objectStore("saves");
        let req=store.put({id:name,val:text});
        req.onsuccess=()=>{
            console.log("存档成功");
        }       
        req.onerror=()=>{
            console.log("存档失败");
        }
    }

    function setSteps(chara,steps){
        mapMap.Players.forEach((player)=>{
            if(player.character==chara){
                player.steps=steps;
            }
        });
    }

    function saveReplay(round,graph,bcast){
        let divround=document.getElementById(`replayRound${round}`);
        if(!divround){
            divround=document.createElement('div');
            divround.setAttribute('id',`replayRound${round}`);
            divround.setAttribute('class','replay-round');
            console.log(divround);
            let replays=document.querySelector('.replay');
            replays.appendChild(divround);
        }
        divround.innerHTML="";
        let graph0=graph.cloneNode(true);
        let bcastlist=bcast.cloneNode(true);
        let bcdiv=document.createElement('div');
        let bcast0=document.createElement('p');
        bcast0.setAttribute("contenteditable","true");
        bcast0.innerText="广播：";
        bcastlist.querySelectorAll('.bcwenben').forEach((ele)=>{
            console.log(ele);
            let cdiv=document.createElement('div');
            cdiv.innerText=ele.innerText;
            cdiv.style.color=ele.style.color;
            bcast0.appendChild(cdiv);
        });
        bcast0.addEventListener("keydown",(e)=>{
            if(e.key=="Enter"){
                bcast0.blur();
            }
        });
        bcast0.style.position="absolute";
        bcast0.style.bottom=0;
        bcdiv.setAttribute('class','replay-bcast');
        bcdiv.style.position="relative";
        bcdiv.appendChild(bcast0);
        divround.appendChild(bcdiv);
        let graphdiv=document.createElement('div');
        graphdiv.setAttribute('class','replay-graph')
        let shadow=graphdiv.attachShadow({mode:'open'});
        graphdiv.setAttribute('class','replay-graph');
        shadow.appendChild(graph0);
        divround.appendChild(graphdiv);
    }

    let Mods={};

    Mods.item={info:[],click:[],result:[]};

    Mods.mechan={info:[],click:[],result:[]};

    let initevents=[];

    let roundendevents=[];

    let stependevents=[];

    function ModsInitEvent(){
        console.log(mapMap);
        initevents.sort((a,b)=>a.priority-b.priority);
        initevents.forEach((ele)=>{
            ele.fun();
        })
    }
    function ModsRoundendEvent(){
        roundendevents.sort((a,b)=>a.priority-b.priority);
        roundendevents.forEach((ele)=>{
            ele.fun();
        })
    }
    function ModsStependEvent(){
        stependevents.sort((a,b)=>a.priority-b.priority);
        stependevents.forEach((ele)=>{
            ele.fun();
        })
    }

    let modlist=[];
    let modlistban=[];
    let modpacks=[];

    mapMap.broadcasts={};

    async function loadMods(){
        mapMap.ModsData={};
        let mods0=await import("./mods.js");
        modpacks=modpacks.concat(mods0.mods(compack));
    }

    // function showMods(){
    //     console.log(modlist);
    //     const existing = document.getElementById('broadcastPopupOverlay');
    //     if (existing) existing.remove();

    //     const overlay = document.createElement('div');
    //     overlay.id = 'broadcastPopupOverlay';
    //     overlay.className = 'popup-overlay';

    //     const popup = document.createElement('div');
    //     popup.className = 'popup-container';

    //     const header = document.createElement('div');
    //     header.className = 'popup-header';

    //     const contentDiv = document.createElement('div');
    //     contentDiv.className = 'broadcasts';
    //     contentDiv.innerHTML = bd1.innerHTML;

    //     popup.appendChild(header);
    //     popup.appendChild(contentDiv);

    //     let text1=document.createElement('text');
    //     text1.innerText="以下模组会被加载：";
    //     text1.style.color="#fff";
    //     contentDiv.appendChild(text1);

    //     let modlistdiv=document.createElement('div');
    //     modlistdiv.setAttribute('class','modlist');
    //     modlist.forEach((mod)=>{
    //         let mbut=document.createElement('button');
    //         mbut.innerText=mod.name;
    //         mbut.addEventListener('click',()=>{
    //             let ind=modlist.indexOf(mod);
    //             modlistban.push(mod);
    //             modlist.splice(ind,1);
    //             showMods();
    //         });
    //         modlistdiv.appendChild(mbut);
    //     });

    //     contentDiv.appendChild(modlistdiv);

    //     let text2=document.createElement('text');
    //     text2.innerText="以下模组被禁用了：";
    //     text2.style.color="#fff";
    //     contentDiv.appendChild(text2);

    //     let modlistbandiv=document.createElement('div');
    //     modlistbandiv.setAttribute('class','modlistban');
    //     modlistban.forEach((mod)=>{
    //         let mbut=document.createElement('button');
    //         mbut.innerText=mod.name;
    //         mbut.addEventListener('click',()=>{
    //             let ind=modlistban.indexOf(mod);
    //             modlist.push(mod);
    //             modlistban.splice(ind,1);
    //             showMods();
    //         });
    //         modlistbandiv.appendChild(mbut);
    //     });

    //     contentDiv.appendChild(modlistbandiv);

    //     let buttonDiv = document.createElement('div');
    //     buttonDiv.className = 'popup-buttons';

    //     const closeButton = document.createElement('button');
    //     closeButton.innerText = '完成';
    //     closeButton.setAttribute("id","closeButton");
    //     closeButton.addEventListener('click', () => {
    //         overlay.remove();
    //     });
    //     buttonDiv.appendChild(closeButton);

    //     popup.appendChild(buttonDiv);

    //     overlay.appendChild(popup);
    //     document.body.appendChild(overlay);

    //     console.log(overlay);
    // }

    function defaultConfig(dom,str,dest){
        function gett(val,typ){
            if(typ=="list"){
                return val.split(" ");
            }
            if(!typ){
                return parseInt(val);
            }
            return val;
        }
        function sett(val,typ){
            if(typ=="list"){
                return val.join(" ");
            }
            return val;
        }
        str=str.trim();
        let dom0=document.createElement('div');
        dom0.setAttribute("class","configdiv");
        dom0.style.display="flex";
        let str0="";
        for(let char of str){
            if(char=='['){
                let sdiv=document.createElement('div');
                sdiv.setAttribute("class","configsubdiv");
                sdiv.innerHTML=str0;
                str0="";
                dom0.appendChild(sdiv);
            }
            else if(char==']'){
                let sdiv=document.createElement('div');
                sdiv.setAttribute("class","configvardiv");
                sdiv.setAttribute("contenteditable","true");
                sdiv.addEventListener("keydown",(e)=>{
                    if(e.key=="Enter"){
                        sdiv.blur();
                    }
                });
                let vatt=str0.split(":");
                let name=vatt[0],val=dest[name]||vatt[1],typ=vatt[2];
                sdiv.innerText=val;
                dest[name]=gett(val,typ);
                sdiv.addEventListener("blur",()=>{
                    let valnew=gett(sdiv.innerText,typ);
                    if(typeof valnew === "number"&&isNaN(valnew)){
                        sdiv.innerText=val;
                        return;
                    }
                    dest[name]=valnew;
                    sdiv.innerText=sett(valnew,typ);
                })
                str0="";
                dom0.appendChild(sdiv);
            }
            else {
                str0+=char;
            }
        }
        if(str0){
            let sdiv=document.createElement('div');
            sdiv.setAttribute("class","configsubdiv");
            sdiv.innerHTML=str0;
            str0="";
            dom0.appendChild(sdiv);
        }
        dom.appendChild(dom0);
    }

    function initMods(){

        Mods={};

        Mods.item={info:[],click:[],result:[]};

        Mods.mechan={info:[],click:[],result:[]};

        initevents=[];

        roundendevents=[];

        stependevents=[];

        modlist=[];

        modpacks.forEach((mod)=>{
            if(!mapMap.ModsConfig[mod.name])return;
            Object.assign(mapMap.broadcasts,mod.broadcasts);
            modlist=modlist.concat(mod.list);
        });
        modlist.forEach((ele)=>{
            Object.keys(ele).forEach((key)=>{
                let key2=key.split("_")[0];
                //console.log(key,key2);
                if(!mapMap.ModsConfig[ele.name]||mapMap.ModsConfig[ele.name].disabled)return;
                if(key2=="mechan"||key2=="item"){
                    let cond=ele[key].cond;
                    Object.keys(ele[key]).forEach((key1)=>{
                        if(key1!="cond"){
                            //console.log(key1);
                            let key1li=key1.split("_");
                            //console.log(cond,key,key1li);
                            Mods[key2][key1li[0]].push({cond:cond,lamda:ele[key][key1],preventDefault:("additional"!=key1li[1])});
                        }
                    });
                }
                if(key2=="init"){
                    //console.log(ele[key]);
                    initevents.push(ele[key]);
                }
                if(key2=="roundend"){
                    //console.log(ele[key]);
                    roundendevents.push(ele[key]);
                }
                if(key2=="stepend"){
                    //console.log(ele[key]);
                    stependevents.push(ele[key]);
                }
            });
        });
        Mods.mechan.info.push({default:true,lamda:(item)=>{
            let info=document.getElementById('info');
            info.innerHTML = (()=>{
                if(item.used=="主持")return `${item.name}机关。再点一次取消激活。`;
                if(item.used)return `${item.name}机关。已被${item.used.name}激活。`;
                return `${item.name}机关。再点一次以激活。`;
            })();
        }});
        Mods.mechan.click.push({default:true,lamda:(item)=>{
            if(STATUS.ty!="normal"&&(!item.used||item.used=="主持")){
                STATUS.val.stpData.push({"ty":"Mechan","val":item.name});
            }
            else if(STATUS.ty=="normal"&&!item.used){
                item.used="主持";
            }
            else if(STATUS.ty=="normal"&&item.used){
                item.used=null;
            }
        }});
        Mods.item.info.push({default:true,lamda:(item)=>{
            let info=document.getElementById('info');
            if(item.ty=='Player'){
                info.innerHTML= `${item.name}。再点一次以丢弃。`
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
                    info.innerHTML= `${item.name}。${posiInfo}再点一次以拾取。`
                }
                else{
                    info.innerHTML= `${item.name}。${posiInfo}再点一次以删除。`
                }
            }
        }});
        Mods.item.click.push({default:true,lamda:(item)=>{
            if(item.ty=='Player'){
                dropItem(item,mapMap.Players.find(player=>player.id==item.val));
            }
            else{
                if(STATUS.ty=='move'||STATUS.ty=='round'){
                pickItem(item,STATUS.val);
                }
                else{
                    deleteItem(item);
                }
            }
        }});
        console.log(Mods); 
        console.log(roundendevents);
    }

    function catchItemAppendFunctions(itemslist){
        itemslist.forEach((item)=>{
            if(item.caught&&item.caught())return true
            item.caught=()=>true;
            let des=Mods.item;
            if(item.type=='机关'){
                des=Mods.mechan;
            }
            Object.keys(des).forEach((key)=>{
                let defaultPreved=false;
                let lamlis=[];
                des[key].forEach((ele)=>{
                    //console.log(ele);
                    if(ele.default&&!defaultPreved){
                        lamlis.push(ele.lamda);
                    }
                    else if(ele.cond&&ele.cond(item)){
                        lamlis.push(ele.lamda);
                        if(ele.preventDefault)defaultPreved=true;
                    }
                });
                item[key]=(item)=>{
                    //console.log(lamlis);
                    lamlis.forEach((lamda)=>{
                        lamda(item);
                    });
                }
            });
        })
    }

    function RANDOM(){
        const rng = new Math.seedrandom("", { state: mapMap.rngstate });
        let val=rng();
        //console.log(val);
        mapMap.rngstate=rng.state();
        return val;
    }

    function setseed(str){
        if(!str)str=prompt("请输入文本");
        if(!str.trim())return;
        let seeddiv=document.querySelector('.randomseed');
        seeddiv.innerText=`随机种子：${str}`;
        mapMap.seed=str;
        const rng = new Math.seedrandom(mapMap.seed,{state: true});
        mapMap.rngstate=rng.state();
        //console.log(rng.state());
    }

    Object.assign(compack, {
        randomInt, hsv2rgb, getStrSize, createPolygon, getMida, getLine, getLineDim,
        getDoor, getNotPortal, getPortal, hexarc, getLocenter, getPath, getImageUrlFromSvg, copySvgAsPngToClipboard,
        isValidCSSColor, shareEdge, swapRom, eraseBracket, title, initLocs, initMapData, createG,
        initDoor, drawDoor, initPlayers, addItems, getLoc, setDoor, drawNames, getCross,
        clearMechan, drawPlayers, switchNormalMode, defaultLocMaskAction, getButton,
        switchRoundMode, LocMaskEvent, reAttriAllPolygons, isNum, isSubseq, getLocorRom,
        killPlayer, sortVisdots, parseColor, getColor, switchMoveMode, createShrinkingCircle, initIcon,
        getRoundColor, drawRoundInfo, drawPlayerInfo, caculateDis, mechanAct,
        nextRound, renderAllLayers, jumpAccordSTATUS, pickItem, dropItem, deleteItem,
        moveItem, getItemActual, drawItems, initRule, getbc, parseTextWithColor, getbcdiv, broadcast,
        showBroadcasts, showEditor, saveMap, loadMap, setSteps,
        saveReplay, loadMods, defaultConfig, initMods, catchItemAppendFunctions, RANDOM, setseed,
    });

    title();
    // window.addEventListener('beforeunload', (event) => {
    //     event.preventDefault();
    //     event.returnValue = '';
    //     return '';
    // });
}

mainMain();
