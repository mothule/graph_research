"use strict";

/**************************************************************
 * メソッド名について<br>
 * プレフィクスに'on'とつくメソッドは全てイベントハンドラになります。<br>
 * プレフィクスに'draw'とつくメソッドは全て表示するためのメソッドになります。<br>
 * プレフィクスに'native'とつくメソッドは全てAndroid側から呼ばれるメソッドになります。<br>
 *************************************************************/

/******************************
 * テストデータ
 *****************************/
var weights;
var fats;
var calories;
var graphDataCache = new Object;    


/******************************
 * 定数
 *****************************/
var ONE_DAY                     = 24 * 60 * 60 * 1000; //!< 1日のミリ秒：変更不可
var PICK_LINE_WIDTH             = 2;                //!< ピッカー線の太さ;
var XAXIS_WIDTH                 = 60;               //!< X軸の要素幅(日づけ間の幅）
var CHART_MARGIN_SIDE           = 0;//30;               //!< チャートの両サイドのマージン
var COLUMN_MARGIN_SIDE          = 27;               //!< 棒グラフのみ発生するマージンの幅：変更不可
var DAY_RANGE                   = 31;              //!< グラフの表示範囲
var COLUMN_SELECT_COLOR         = 'red';            //!< 棒グラフを選択した時の色
var XAXIS_ALTERNATE_GRID_COLOR  = '#f0f0ff';        //!< X軸の1つおきのグリッド色
var XAXIS_GRID_LINE_COLOR       = "#dddddd";        //!< X軸のグリッド色
var CALORIE_COLUMN_COLOR        = 'pink';           //!< 消費カロリー（棒グラフ）の色
var CALORIE_COLUMN_NAME         = '消費カロリー';     //!< 消費カロリー（棒グラフ）の名称

var YAXIS_CALORIE_LABEL_COLOR   = "#fcb3bf";        //!< Y軸消費カロリーラベルの色
var YAXIS_WEIGHT_LABEL_COLOR    = '#fcb3bf';        //!< Y軸体重ラベルの色
var YAXIS_FAT_LABEL_COLOR       = '#2020a0';        //!< Y軸体脂肪ラベルの色
var XAXIS_LABEL_DEFAULT_COLOR   = "#A1A5BA";        //!< X軸ラベルのデフォルト色
var XAXIS_LABEL_SAT_COLOR       = "#68ACE4";        //!< X軸ラベルの土曜日色
var XAXIS_LABEL_SUN_COLOR       = "#D9615C";        //!< X軸ラベルの日曜日色
var YAXIS_LABEL_FONT_SIZE       = 4;                //!< Y軸ラベルのフォントサイズ
var PREFETCH_LENGTH 			= 8;				//!< 現在時刻を選択できるように近い未来日まで読む必要があったので用意


// 時間の単位列挙
var DATE_UNIT_HOUR = 0;
var DATE_UNIT_DAY = 1;

// データの種類列挙
var GRAPH_DATA_TYPE_BODY_COMPOSITION = 0;           //!< グラフデータの種類：体重・体脂肪
var GRAPH_DATA_TYPE_CALORIE = 1;                    //!< グラフデータの種類：カロリー

// グラフ種類列挙
var GRAPH_TYPE_LINE = 0;                            //!< グラフ種類_折れ線
var GRAPH_TYPE_COLUMN = 1;                          //!< グラフ種類_棒グラフ

// グラフポイント間の距離算出用調整値 列挙
// 棒グラフだと原因不明でズレてしまうため用意.
var XAXIS_WIDTH_ADJUST_LINE     = 0;                //!< グラフポイント間の調整値_折れ線
var XAXIS_WIDTH_ADJUST_COLUMN   = 0;//-0.081;//-0.091;           //!< グラフポイント間の調整値_棒グラフ

/******************************
 * グローバル変数(js内で使用する)
 *****************************/
var chart;                  //!< チャートインスタンス
var now;                    //!< 今の日付（年、月、日のみ）
var dispWidth;              //!< ブラウザの幅
var dispHeight;             //!< ブラウザの高さ
var beginDate;              //!< データの取得開始日
var endDate;                //!< データの取得終了日
var contentWidth;           //!< コンテナの幅
var series;
var yAxisLabelInfos;        //!< Y軸ラベルの情報一覧
var beforeSelectedDate;		//!< １つ前に選択していた日付
var graphTypeDependMargin = 0;  //!< グラフタイプ依存のマージン値
var beforeSelectedGraphData; //!< 前回選択してたグラフデータ:空を選択した場合に選択状態が残るため。


/******************************
 * グローバル変数(Androidから受け取る)
 *****************************/
var graphDataType = 0;      //!< グラフデータの種類(GRAPH_DATA_TYPE_***)
var graphType = 0;          //!< グラフの種類（GRAPH_TYPE_***）
var dateUnit = 0;           //!< 時間の単位（DATE_UNIT_***)
var targetLineBeginDate;    //!< 目標体重ラインの開始日
var targetLineEndDate;      //!< 目標体重ラインの終了日

var android;

/******************************
 * デバッグ
 *****************************/
var useDummyData = false;
var test=false;

if(android===undefined){
    useDummyData = true;
}




//TODO
//Android側から単位の切り替え、データの切り替えを行うこと。
//グラフの単位を時で動けるようにすること。
//グラフの単位を日から時に変えれるようにすること


/***************************************************************************
 * グラフタイプを変更する
 **************************************************************************/
function onClickChangeType()
{
    graphDataType = GRAPH_DATA_TYPE_CALORIE;
    
    test = !test;
    
    onPreInitializeGraph();

    onInitializeGraph();
    
    onPostInitializeGraph();
}

/*************************************************************************
 * エントリー関数
 * ページがロードされた後に、グラフを出力する
 * @returns {undefined}
 ************************************************************************/
$(function()
{
    beginLog('Begin onLoaded');
    
    onInitializeEnv();
    
    onPreInitializeGraph();

    onInitializeGraph();
    
    onPostInitializeGraph();
 
    endLog('End onLoaded');
});

/**
 * 環境パラメタ類の初期化
 */
function onInitializeEnv()
{
    // ブラウザの幅・高さを取得
    // ブラウザは一度グラフを描画した後に、再度取得すると何故か幅が広くなっている。
    // 結果位置がずれる.
    // なので、取得を一度っきりにしている。
    dispWidth  = $(document).width();
    dispHeight = $(document).height();
    nlog('ブラウザ幅・高さ:'+dispWidth+','+dispHeight);
}


/************************************************************************
 * グラフ初期化の直前<br>
 * Highchartsにパラメータを渡す前に呼ばれます.
 ***********************************************************************/
function onPreInitializeGraph()
{
	console.group('onPreInitializeGraph');

	beginLog('Begin onPreInitializeGraph');

    if(useDummyData){ 
        // JS上でパラメータを初期化
        initGraphDataFromJs();
    }else{
        // Androidから初期化データを取得し、パラメータを初期化
        initGraphDataFromAndroid();
    }

    // 現在日の取得(時・分・秒排除）
    now = truncateTime( new Date(), dateUnit);
    

    // データの取得開始日と終了日を取得
    beginDate = new Date( now.getTime() - ((DAY_RANGE-PREFETCH_LENGTH) * ONE_DAY) );
    endDate   = new Date( now.getTime() + (PREFETCH_LENGTH * ONE_DAY) );
    nlog('データ取得の開始と終了日:'+beginDate.toLocaleString()+' : '+endDate.toLocaleString());

    var diff = endDate.getDate() - beginDate.getDate();
    nlog('範囲:'+diff);
    
    

    // グラフを描画するためのコンテンツ幅を設定する
    // コンテンツ幅は、棒グラフマージン、チャートマージン、チャート幅を考慮している。
    // コンテンツ領域内でグラフは描画される。
    // なのでマージンも考慮した大きさにしないと、想定より小さいグラフになる）
    if(graphDataType===GRAPH_DATA_TYPE_CALORIE){
        graphTypeDependMargin = COLUMN_MARGIN_SIDE;
    }
    contentWidth = (XAXIS_WIDTH * DAY_RANGE) + (graphTypeDependMargin*2) + (CHART_MARGIN_SIDE*2);
    $('#container').css('width', contentWidth );
    nlog('コンテンツ幅:'+contentWidth);
    
    // seriesの設定
    series = new Array;
    if(graphDataType===GRAPH_DATA_TYPE_BODY_COMPOSITION){
        
        // 体重・体脂肪・目標日までの理想線
        series = [
            {
                yAxis:0,
                name: '体重',
                zIndex : 1,
                color:'#fcb3bf',
                data: weights
            },
            {// 体脂肪
                yAxis:1,
                name : '体脂肪',
                zIndex : 2,
                color:'#2020a0',
                data: fats
            },
            {// 目標日までの理想線を破線ピンク色で表示
                yAxis:0,
                name : '目標線',
                color : 'pink',
                dashStyle : 'dot',
                marker:{ radius:3 },
                zIndex : 0,
                data:[84, 50],
                pointStart      : targetLineBeginDate.getTime(),
                pointInterval   : targetLineEndDate.getTime() - targetLineBeginDate.getTime()
            }
        ];
        
        yAxisLabelInfos = [
            {// 体重
                axisId : 0,
                opposite : false,
                color : YAXIS_WEIGHT_LABEL_COLOR,
                min   : 0,
                max   : 0,
                avg   : 0
            },
            {// 体脂肪
                axisId : 1,
                opposite : true,
                color : YAXIS_FAT_LABEL_COLOR,
                min   : 0,
                max   : 0,
                avg   : 0
            }
        ];
        
        
    }else if(graphDataType===GRAPH_DATA_TYPE_CALORIE){
        series = [
            {// 消費カロリー
                yAxis:2,
                name : CALORIE_COLUMN_NAME,
                color : CALORIE_COLUMN_COLOR,
                type : 'column',
                data : calories
            }     
        ];        
        yAxisLabelInfos = [
            {// 消費カロリー
                axisId : 2,
                opposite : false,
                color : YAXIS_CALORIE_LABEL_COLOR,
                min   : 0,
                max   : 0,
                avg   : 0
            }
        ];        
    }

    endLog('End onPreInitializeGraph');
    console.groupEnd();
}

/************************************************************************
 * Androidからグラフデータを初期化.
 ***********************************************************************/
function initGraphDataFromAndroid()
{
    beginLog('Begin initGraphDataFromAndroid');
    
    // Androidからデータを受け取り,評価実行する.
    var data = android.getGraphData();
    var tmp;
    eval("tmp = "+data);

    // データをパラメータに反映させる.
    setupFromReceiveData(tmp);
    
    // 固定パラメタの修正
    configureConstantParameter(dateUnit);
    
    endLog('End initGraphDataFromAndroid');
}

/************************************************************************
 * JavaScript上でグラフデータを初期化.
 ***********************************************************************/
function initGraphDataFromJs()
{
    beginLog('Begin initGraphDataFromJs');
    
    var data = getDummyJsonString();
    var tmp; 
    eval("tmp="+data); 
    nlog("Generated Json Dummy Datas = "+data); 
    
    // データをパラメータに反映させる
    setupFromReceiveData(tmp);
    
    endLog('End initGraphDataFromJs');
}
/***********************************************************************
 * Androidから受け取ったパラメータをセットする
 * @param {type} rcvData 受け取ったデータ・セット
 ***********************************************************************/
function setupFromReceiveData(rcvData)
{
    // リマップ作業：ジオメトリデータからオブジェクトデータへ変換する
    rcvData['targetLineBeginDate'] = new Date(rcvData['targetLineBeginDate']);
    rcvData['targetLineEndDate'] = new Date(rcvData['targetLineEndDate']);
    
    
    // JS側パラメータへ設定する
    graphDataType = rcvData['graphDataType'];
    graphType = rcvData['graphType'];
    dateUnit = rcvData['dateUnit'];
    targetLineBeginDate = rcvData['targetLineBeginDate'];
    targetLineEndDate = rcvData['targetLineEndDate'];
    
   
    weights = rcvData['weights'];
    fats = rcvData['fats'];
    calories = rcvData['calories'];
}



/***********************************************************************
 * 指定Dateの時・分・秒を排除
 * @param {Date} date 削除対象
 * @param {Integer} dateUnit 日付の単位
 * @returns {Date} 排除後のDate
 ***********************************************************************/
function truncateTime(date, dateUnit){
    if(dateUnit===DATE_UNIT_DAY){
        return new Date(date.getYear()+1900, date.getMonth(), date.getDate());
    }else if(dateUnit===DATE_UNIT_HOUR){
        return new Date(date.getYear()+1900, date.getMonth(), date.getDate(), date.getHours());
    }
}

/***********************************************************************
 * グラフの初期化<br>
 * この中でHighchartsにパラメータを渡して初期化する.
 ***********************************************************************/
function onInitializeGraph()
{
    beginLog('Begin onInitializeGraph');

    //ローカルのロケールを使用
    Highcharts.setOptions({
        global: {
//            canvasToolsURL: 'file:///android_asset/GraphHTML/js/modules/canvas-tools.min.js',
            useUTC: false
        },
        lang : {
            weekdays : ['日','月','火','水','木','金','土'],
            shortMonths : ['1','2','3','4','5','6','7','8','9','10','11','12']
        }
    });


    // グラフオプションを指定
    var options = 
    {
        plotOptions: {
            series: { 
                animation: false,
                enableMouseTracking: false
            },
            
            // 棒グラフで選択した時の色
            column : {
                states : {
                    select : { color : COLUMN_SELECT_COLOR, borderColor: COLUMN_SELECT_COLOR }
                }
            }
        },
        
        // Highchartクレジットを非表示
        credits : { enabled : false },
        
        chart: {
            marginLeft:CHART_MARGIN_SIDE,
            marginRight:CHART_MARGIN_SIDE,
            renderTo: 'container',
            animation : false,
            
            // ロード完了ハンドラの設定
            events: { load : onChartLoad }
         
        },
        title: { text: null },
        tooltip: { enabled: false },
        scrollbar : { enabled : true },
        legend : {enabled : false},

        // X軸
        xAxis: {            
            alternateGridColor: XAXIS_ALTERNATE_GRID_COLOR,  // 1つおきのグリッド色
            type: 'datetime',               // 軸の値タイプ
            gridLineColor: XAXIS_GRID_LINE_COLOR,
            gridLineWidth: '1',

            labels: {
            	overflow: 'justify',
                formatter: function(){ 
                    return getXAxisLabel(this.value, dateUnit); 
                }
            },
            
            tickInterval: ONE_DAY,
            tickLength : 0,
            min: beginDate.getTime(),
            max: endDate.getTime()
        },

        // Y軸
        yAxis: [
            {// 体重. 表示してもスクロールすると見えなくなるため、全部非表示
                id:0,
                title : { text : null },
                gridLineWidth : 0,
                offset : 0,     // 軸の位置
                lineWidth : 0, // Y軸の線
                labels : { enabled : false } // ラベル非表示
            },
            
            {// 体脂肪. 表示してもスクロールすると見えなくなるため、全部非表示
                id:1,
                title : { text : null },
                opposite : true,
                gridLineWidth:0,
                labels : { enabled : false }, // ラベル非表示
                max : 100
            },
            
            {// 消費カロリー, 表示してもスクロールすると見えなくなるため、全部非表示
                id:2,
                title : { text : null },
                gridLineWidth:0,
                labels : { enabled : false } // ラベル非表示
            }
        ],

        // シリーズの設定
        series: series
    };
    

    // グラフを作成
    chart = new Highcharts.Chart(options);
    

    endLog('End onInitializeGraph');
}


/*************************************************************************
 * チャートの読み込みが完了したら呼ばれる
 * @param {} event
 ************************************************************************/
function onChartLoad(event)
{
    beginLog('Begin onChartLoad');
    

    // キャッシュ作成
    var chart = $('#container').highcharts();
    var cache = graphDataCache;
    var series = chart.series[0];
    var datas = new Array; datas = series.data;
    for(var i=0,len=datas.length; i < len; ++i){
    	var data = datas[i];
    	if(data !== undefined){
    	    cache[data.category] = data;
    	}
   	}
    nlog('cache:');
   	console.dir(cache);


    // ピックラインの描画
    drawPickLine();

//    var minMaxAvg = new Object;
//    minMaxAvg = getMinMaxAvg(weights);
//    yAxisLabelInfos[0]['min'] = minMaxAvg['min'];
//    yAxisLabelInfos[0]['max'] = minMaxAvg['max'];
//    yAxisLabelInfos[0]['avg'] = minMaxAvg['avg'];
//        
//
//    minMaxAvg = getMinMaxAvg(fats);
//    yAxisLabelInfos[1]['min'] = minMaxAvg['min'];
//    yAxisLabelInfos[1]['max'] = minMaxAvg['max'];
//    yAxisLabelInfos[1]['avg'] = minMaxAvg['avg'];
     
    var minMaxAvg = getMinMaxAvg(calories, true);
    yAxisLabelInfos[0]['min'] = minMaxAvg['min'];
    yAxisLabelInfos[0]['max'] = minMaxAvg['max'];
    yAxisLabelInfos[0]['avg'] = minMaxAvg['avg'];
     
    // 渡されたY軸用ラベルと破線を描画する
    var infos = yAxisLabelInfos;
    for(var i = 0, length = infos.length; i < length; ++i){
        var info = infos[i];
        var color = info['color'];
        var axisId = info['axisId'];
        drawYAxisLabel(axisId, info['min'], false, color); // 最小値
        drawYAxisLabel(axisId, info['avg'], false, color); // 平均値
        drawYAxisLabel(axisId, info['max'], false, color); // 最大値
    }


    drawYAxisLabel(0, 50, false,color); // 目標値
    
    

    endLog('End onChartLoad');
}

/***********************************************************************
 * グラフ初期化の直後<br>
 * グラフの読み込み処理が完了した場合は、{onChartLoad}になります。
 ***********************************************************************/
function onPostInitializeGraph()
{
    beginLog('Begin onPostInitializeGraph');
    
    // スクロールの移動コールバックを設定
    $(window).scroll(onMoveScroll); 
     
    $(window).scrollLeft(29596); // スクロールを一番右へ移動,値超えても止まる.

    
    endLog('End onPostInitializeGraph');
} 


/***********************************************************************
 * スクロールの移動直後
 ***********************************************************************/
function onMoveScroll()
{
    var log = '';

    // スクロール位置からピッカーの位置を割り出して、選択している日付を算出する。
    var scrollLeft = $(window).scrollLeft() - (graphTypeDependMargin + CHART_MARGIN_SIDE);
    var pickPos = scrollLeft + (dispWidth/2) - (PICK_LINE_WIDTH/2);
    var rate = ONE_DAY / XAXIS_WIDTH;
    var ms = (beginDate.getTime()) + (pickPos * rate);
    var date = new Date(ms); 

    // グラフ値の日付の前後をその日付を選択したことにしたいので、範囲内に入ればずらす.
    if(dateUnit===DATE_UNIT_DAY){
        if(date.getHours() >= 12){
            date.setDate(date.getDate()+1);
        }
    }else if(dateUnit===DATE_UNIT_HOUR){
        if(date.getMinutes() >= 30){
            date.setHours(date.getHours() + 1);
        }
    }else{
    	console.error('日付単位dateUnitが不正値:'+dateUnit);
    }
    
    drawDebugLabel(date.toLocaleString());


    // グラフデータ配列のIndexを算出する
    date = truncateTime(date, dateUnit);
//    var diffTime = date.getTime() - (beginDate.getTime()-(PREFETCH_LENGTH*ONE_DAY));
//    var index = (diffTime / ONE_DAY) - 1; // -1 => 計算で参照位置がずれるため.詳細は未調査. 

    log += ' カーソルが選んでいる現在日付(補正済み):'+date.toString();
//    log += ' DiffTime:'+diffTime;
//    log += ' 算出されたグラフデータ配列のIndex:'+index;

    {// キャッシュからグラフデータを取得し,選択状態を更新する
    	var cacheKey = date.getTime();
    	var data = graphDataCache[cacheKey];
        if(data !== null && data !== undefined){
            if(!data.selected){
                data.select();
                beforeSelectedGraphData = data;
            }
        }else{
        	if(beforeSelectedGraphData !== undefined){
        		if(beforeSelectedGraphData.selected){
        			beforeSelectedGraphData.select();
        		}
    		}
    	}
    }


    // リスナー通知
    // 日付が変わったらAndroidに通知
    if(android !== undefined)
    {
    	var beforeTime = null, newTime = date.getTime();
        if(beforeSelectedDate===undefined){// 初回
            beforeSelectedDate = new Date(date);
            beforeTime = beforeSelectedDate.getTime();
        }
        
        {
        	// 時間が変化をチェック
        	var isChangedDate = false;
        	if(dateUnit===DATE_UNIT_DAY){
        		isChangedDate = beforeSelectedDate.getDate() !== date.getDate();
        	}else if(dateUnit===DATE_UNIT_HOUR){
        		isChangedDate = beforeSelectedDate.getHours() !== date.getHours();
       		}
        	
       		// 変化してたら前回選択日付を設定
        	if(isChangedDate){
        		beforeTime = beforeSelectedDate.getTime();
       		}

            if(beforeTime !== null){
                android.onChangedSelectedDate(beforeTime, date.getTime());
                beforeSelectedDate = new Date(date); // 変更されたタイミングのみ保存.
            }
        }
    }

    nlog(log);
}

/***********************************************************************
 * JSONデータを受信.
 * Android側から呼ばれる.
 * @param {String} json
 * @param {Boolean} doRefresh
 ***********************************************************************/
function nativeReceiveJsonData(json,doRefresh)
{
    beginLog('Begin nativeReceiveJsonData');
    nlog(json);
    
    // 
    var receiveData = JSON.parse(json);
    setupFromReceiveData(receiveData);
    
    if(doRefresh){
        onLoaded();
    }
    
    endLog('End nativeReceiveJsonData');
}




/***********************************************************************
 * デバッグラベルにテキスト描画
 * @param {type} text テキスト
 **********************************************************************/
function drawDebugLabel(text){
    $('#debug').text(text);
};

/***********************************************************************
 * 選択している領域を示す線の描画
 **********************************************************************/
function drawPickLine(){
    $('#centerLine').css({
        'width'     : PICK_LINE_WIDTH,
        'height'    : '100%',
        'left'      : (dispWidth / 2) - (PICK_LINE_WIDTH / 2)
    });
};

/***********************************************************************
 * Y軸のラベルを描画（自力描画）
 * @param {Number} yAxisId Y軸のID
 * @param {String} value Y軸の値
 * @param {Boolean} opposite 右側に描画する
 * @param {String} color 色
 **********************************************************************/
function drawYAxisLabel(yAxisId, value, opposite, color)
{
    var chart = $('#container').highcharts();

    // テキストの描画
    var cssAttr = {
        'color'     : color,
        'font-size' : YAXIS_LABEL_FONT_SIZE,
        'position'  : 'fixed',
        'top'       : chart.yAxis[yAxisId].toPixels(value) - (YAXIS_LABEL_FONT_SIZE+1)
    };
    cssAttr[opposite ? 'right' : 'left'] = YAXIS_LABEL_FONT_SIZE;
    var label = $('<div>').text(value).css(cssAttr);
    $('#container').after(label);    

    // 破線の描画
    cssAttr = {
        'width'     : '97%',
        'height'    : 1,
        'position'  : 'fixed',
        'top'       : chart.yAxis[yAxisId].toPixels(value),
        'border-top': '1px dashed ' + color
    };

    // テキストの長さに応じて横線の位置をズラす
    var offset = value.toString().length * YAXIS_LABEL_FONT_SIZE*2;
    cssAttr[opposite ? 'right' : 'left'] = offset;
    var dashLine = $('<div>').css(cssAttr);
    $('#container').after(dashLine);
};


/***********************************************************************
 * X軸の描画用ラベルを取得
 * @param {Number} value milliseconds since Jan 1st 1970 
 * @param {Integer} dateUnit 日付の単位
 * @returns {文字列}
 **********************************************************************/
function getXAxisLabel(value, dateUnit)
{
    var date = new Date(value);
    
    // Date文字列を算出
    var dateString = function(){
        // 日毎の場合
        if(dateUnit===DATE_UNIT_DAY){
            return (date.getMonth()+1) + '/' + date.getDate();
        }

        // 時毎の場合
        var hour = date.getHours();
        if(hour===0){
            // 0時であれば日付にする
            return (date.getMonth()+1) + '/' + date.getDate();
            
        }else if(hour%3!==0){
            // 0時以外は3回に１回非表示
            return '';
            
        }else{
            // それ以外は通常通り表示
            return hour + ":00";
        }
    }();
    
    // 文字列をCSSスタイルをデコレートする
    var functor = function(color,string,bgcolor){
        return '<span style="color:'+color+'; background-color:'+bgcolor+';">'+string+'</span>';
    };

    //土日だけ文字色を変更させる
    var result = function(){
        var bgcolor = "#303020"; // TODO : 背景指定してるが変化せず.
        if(date.getDay()===6){ // 土曜日
            return functor(XAXIS_LABEL_SAT_COLOR, dateString, bgcolor);
        }else if (date.getDay()===0){ // 日曜日
            return functor(XAXIS_LABEL_SUN_COLOR, dateString, bgcolor);
        }else{
            return functor(XAXIS_LABEL_DEFAULT_COLOR, dateString, bgcolor);
        }
        return functor(XAXIS_LABEL_DEFAULT_COLOR, dateString, bgcolor);
    }();
    
    return result;
}





/***********************************************************************
 * JSONダミー取得
 * @returns {String} JSON
 **********************************************************************/
function getDummyJsonString()
{
    var result = new Object();
//    result['graphType']             = GRAPH_TYPE_COLUMN;
    result['dateUnit']  = DATE_UNIT_HOUR;
    
    dateUnit = result['dateUnit'];
    configureConstantParameter(dateUnit);
    
    now = truncateTime(new Date(), dateUnit);
    result['targetLineBeginDate']   = now.getTime();
    result['targetLineEndDate']     = new Date().setDate(now.getDate() + 1);
    result['graphDataType']         = GRAPH_DATA_TYPE_CALORIE; //GRAPH_DATA_TYPE_BODY_COMPOSITION;
    
    
    result['calories']              = getDummyCalorie(now, dateUnit);
    result['fats']                  = getDummyBodyComposition(now, dateUnit, false);
    result['weights']               = getDummyBodyComposition(now, dateUnit, true);

    return JSON.stringify(result);
}

/***************************************************************************
 * 固定パラメータの設定
 * 日付のタイプから固定パラメータを修正する.
 **************************************************************************/
function configureConstantParameter(dateUnit)
{
    if(dateUnit===DATE_UNIT_HOUR){
        DAY_RANGE = 24*3;
        ONE_DAY = 1 * 60 * 60 * 1000; // 1Hour
        XAXIS_WIDTH = 25;
        COLUMN_MARGIN_SIDE = 11;         
        
    }
}



/*************************************************************************
 * 体重or体脂肪のダミーデータ取得
 * @param {type} now
 * @param {Integer} dateUnit    日付の単位
 * @param {Boolean} isWeight 体重データを取得するか？
 * @returns {Array}
 ************************************************************************/
function getDummyBodyComposition(now, dateUnit, isWeight)
{
    var currentDate = new Date(now);
    if(dateUnit===DATE_UNIT_HOUR){
        currentDate.setHours( currentDate.getHours() - DAY_RANGE);
    }else if(dateUnit===DATE_UNIT_DAY){
        currentDate.setDate( currentDate.getDate() - DAY_RANGE);
    }
    
    var data = new Array;
    for(var i=0; i<DAY_RANGE+1; ++i){
        var val;
        
        if(isWeight){
            val = Math.floor(Math.random()*140) + 20;
        }else{
            val = Math.floor(Math.random()*1000) / 10;
        }
        data[i] = [ currentDate.getTime(), val ];
        currentDate.setDate(currentDate.getDate()+1);
    }
    return data;
}


/***********************************************************************
 * 消費カロリーダミー取得
 * @param {Long} now
 * @param {Boolean} dateUnit
 * @returns {Array}
 ***********************************************************************/
function getDummyCalorie(now, dateUnit)
{
    var days = new Array;
    var currentDay = new Date(now);
    if(dateUnit===DATE_UNIT_HOUR){
        currentDay.setHours( currentDay.getHours()-DAY_RANGE);
        for(var i =0; i < DAY_RANGE+1; ++i){
            days[i] = new Date(currentDay).getTime();
            currentDay.setHours( currentDay.getHours() + 1); //次の時間へ
        }
        
    }else if(dateUnit===DATE_UNIT_DAY){
        currentDay.setDate( currentDay.getDate()-DAY_RANGE);
        for(var i =0; i < DAY_RANGE+1; ++i){
            days[i] = new Date(currentDay).getTime();
            currentDay.setDate( currentDay.getDate() + 1); //次の日へ
        }
    }

    var color = 'pink';
    var data = new Array;
    for(var i=0; i<DAY_RANGE+1; i++){
        var weight = Math.floor(Math.random()*90000) / 10;
        data[i] = new Object;
        data[i] = { color : color, x : days[i], y : weight};
    }
    
    return data;
}

/***********************************************************************
 * 最小・最大・平均の取得
 * @param {type} datas
 * @param {type} isMap
 * @returns {getMinMaxAvg.Anonym$15}
 ***********************************************************************/
function getMinMaxAvg(datas, isMap)
{
    var min = Number.MAX_VALUE;
    var max = 0;
    var avg = 0;
    
    if(datas){
        var len = datas.length;
        for(var i = 0; i < len; ++i){
            var data;
            if(isMap){
                data = datas[i]['y'];
            }else{
                data = datas[i][1];
            }

            min = Math.min(min, data);
            max = Math.max(max, data);
            avg += data;
        }
        avg = avg / len;
        avg = avg.toFixed(1);
    }
    
    return {
        'min' : min,
        'max' : max,
        'avg' : avg        
    };    
}