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

/******************************
 * 定数
 *****************************/
var ONE_DAY                     = 24 * 3600 * 1000; //!< 1日のミリ秒
var PICK_LINE_WIDTH             = 4;                //!< ピッカー線の太さ
var XAXIS_WIDTH                 = 56;               //!< X軸の要素幅(日づけ間の幅）
var CHART_MARGIN_SIDE           = 30;               //!< チャートの両サイドのマージン
var COLUMN_MARGIN_SIDE          = 26;               //!< 棒グラフのみ発生するマージンの幅
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

// データの種類列挙
var GRAPH_DATA_TYPE_BODY_COMPOSITION = 0;           //!< グラフデータの種類：体重・体脂肪
var GRAPH_DATA_TYPE_CALORIE = 1;                    //!< グラフデータの種類：カロリー

// グラフ種類列挙
var GRAPH_TYPE_LINE = 0;                            //!< グラフ種類_折れ線
var GRAPH_TYPE_COLUMN = 1;                          //!< グラフ種類_棒グラフ

// グラフポイント間の距離算出用調整値 列挙
// 棒グラフだと原因不明でズレてしまうため用意.
var XAXIS_WIDTH_ADJUST_LINE     = 0;                //!< グラフポイント間の調整値_折れ線
var XAXIS_WIDTH_ADJUST_COLUMN   = -0.091;           //!< グラフポイント間の調整値_棒グラフ

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
var xAxisWidthAdjust;       //!< グラフのポイント間の距離算出用調整値(XAXIS_WIDTH_ADJUST_***)
var series;
var yAxisLabelInfos;        //!< Y軸ラベルの情報一覧
var beforeSelectedDate;		//!< １つ前に選択していた日付

/******************************
 * グローバル変数(Androidから受け取る)
 *****************************/
var graphDataType = 0;      //!< グラフデータの種類(GRAPH_DATA_TYPE_***)
var graphType = 0;          //!< グラフの種類（GRAPH_TYPE_***）
var dateIntervalType = 0;   //!< 0:日 1:週 2:月
var targetLineBeginDate;    //!< 目標体重ラインの開始日
var targetLineEndDate;      //!< 目標体重ラインの終了日

var android;




// エントリー関数
// ページがロードされた後に、グラフを出力する
$(function()
{
    beginLog('Begin onLoaded');
    
    onPreInitializeGraph();

    onInitializeGraph();
    
    onPostInitializeGraph();
 
    endLog('End onLoaded');
});

/**
 * ページがロードされたら呼ばれます
 */


/**
 * Androidからグラフデータを初期化する
 */
function initGraphDataFromAndroid()
{
    beginLog('Begin initGraphDataFromAndroid');
    
    // Androidからデータを受け取り,評価実行する.
    var data = android.getGraphData();
    var tmp;
    eval("tmp = "+data);
    
    // データをパラメータに反映させる.
    setupFromReceiveData(tmp);
    
    endLog('End initGraphDataFromAndroid');
}

/**
 * JS上でグラフデータを初期化する
 */
function initGraphDataFromJs()
{
    beginLog('Begin initGraphDataFromJs');
    
    var data = getDummyJsonString();
    var tmp;
    eval("tmp = "+data);
    
    // データをパラメータに反映させる
    setupFromReceiveData(tmp);
    
    endLog('End initGraphDataFromJs');
}

/**
 * グラフの初期化前に呼ばれます
 */
function onPreInitializeGraph()
{
    beginLog('Begin onPreInitializeGraph');

    if(android !== undefined){
        // Androidから初期化データを取得し、パラメータを初期化
        initGraphDataFromAndroid();
    }else{
        // JS上でパラメータを初期化
        initGraphDataFromJs();
    }

    // 現在日の取得
    now = truncateTime( new Date() );

    // ブラウザの幅・高さを取得
    dispWidth  = $(document).width();
    dispHeight = $(document).height();
    nlog('ブラウザ幅・高さ:'+dispWidth+','+dispHeight);
    
    // データの取得開始日と終了日を取得
    beginDate = new Date( now.getTime() - (DAY_RANGE * ONE_DAY) );
    endDate   = new Date( now.getTime() );
    nlog('データ取得の開始と終了日:'+beginDate.toLocaleString()+' : '+endDate.toLocaleString());
    

    // コンテンツ幅：棒グラフマージン、チャートマージン、チャート幅
    contentWidth = COLUMN_MARGIN_SIDE + 2*CHART_MARGIN_SIDE + XAXIS_WIDTH * DAY_RANGE;
    $('#container').css('width', contentWidth );
    nlog('コンテンツ幅:'+contentWidth);
    
    
    // X軸値の間の調整値
    if(graphType===GRAPH_TYPE_LINE){
        xAxisWidthAdjust = XAXIS_WIDTH_ADJUST_LINE;
        
    }else if(graphType===GRAPH_TYPE_COLUMN){
        xAxisWidthAdjust = XAXIS_WIDTH_ADJUST_COLUMN;
    }

    
    
    
    
    
    // seriesの設定
    series = new Array;
    if(graphDataType===GRAPH_DATA_TYPE_BODY_COMPOSITION){
        
        series = [
            {// 体重
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
}

/**
 * 時間要素の削除.
 * @param {Date} date 削除対象
 * @returns {Date}
 */
function truncateTime(date){
    return new Date(date.getYear()+1900, date.getMonth(), date.getDate());
}

/**
 * グラフの初期化
 */
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
//                x: XAXIS_WIDTH/2,
                formatter: function(){ 
                    return getXAxisLabel(this.value); 
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
                

    // データをハッシュに変換
        series: series
    };
    

    // グラフを作成
    chart = new Highcharts.Chart(options);    

    endLog('End onInitializeGraph');
}

/**
 * グラフの初期化処理が呼ばれた後に呼ばれます<br>
 * グラフの読み込み処理が完了した場合は、{onChartLoad}になります。
 */
function onPostInitializeGraph()
{
    beginLog('Begin onPostInitializeGraph');
    
    // スクロールの移動コールバックを設定
    $(window).scroll(onMoveScroll); 
    
 //   $(window).scrollLeft(29596); // スクロールを一番右へ移動,値超えても止まる.
    
    endLog('End onPostInitializeGraph');
}

/**
 * チャートの読み込みが完了したら呼ばれる
 * @param {} event
 */
function onChartLoad(event){
    beginLog('Begin onChartLoad');

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

/**
 * スクロールが移動した時に呼ばれる
 */
function onMoveScroll()
{
    var log = '';

    // スクロール位置をカーソルとし、ピッカーの位置にある日付を算出します
    var scrollLeft = $(window).scrollLeft();
    var pickPos = (scrollLeft-(CHART_MARGIN_SIDE+COLUMN_MARGIN_SIDE)) + (dispWidth/2) - (PICK_LINE_WIDTH/2);
    var rate = ONE_DAY / (XAXIS_WIDTH + xAxisWidthAdjust);
    var ms = beginDate.getTime() + (pickPos * rate);
    var date = new Date(ms);

    // 日付の前後をその日付を選択したことにしたいので、午後は次の日にする。
    if(date.getHours() > 12){
        date.setDate(date.getDate()+1);
    }
    log += 'Selected Date : ' + date.toLocaleString() + '\n';
    date = truncateTime(date);

    // グラフデータ配列のIndexを算出する
    var diffTime = date.getTime() - beginDate.getTime();
    var index = diffTime / ONE_DAY;
    log += '算出されたグラフデータ配列のIndex:'+index+'\n';

    // 指定のグラフを選択状態にする
    var series = chart.series[0];
    var data = series.data[index];
    
    var d = new Date(data.category);
    nlog("選択したグラフデータの日付:"+d.toLocaleDateString());
    
    if(data !== null){
        if(!data.selected){
            data.select();
        }
    }
    
    // 日付が変わったらAndroidに通知
    if(android !== undefined)
    {
        var beforeTime = null;
        if(beforeSelectedDate===undefined){// 初回
            beforeTime = 0;
        }else{
            // 日にちが違っていたら変わっていると判断.
            if(beforeSelectedDate.getDate() !== date.getDate()){ 
                beforeTime = beforeSelectedDate.getTime();
            }

            if(beforeTime!==null){
                android.onChangedSelectedDate(beforeTime, date.getTime());
                beforeSelectedDate = new Date(date); // 変更されたタイミングのみ保存.
            }
        }
    }
    


    drawDebugLabel(date.toLocaleString());
    nlog(log);
}

function setupFromReceiveData(rcvData)
{
    // リマップ作業：ジオメトリデータからオブジェクトデータへ変換する
    rcvData['targetLineBeginDate'] = new Date(rcvData['targetLineBeginDate']);
    rcvData['targetLineEndDate'] = new Date(rcvData['targetLineEndDate']);
    
    
    // JS側パラメータへ設定する
    graphDataType = rcvData['graphDataType'];
    graphType = rcvData['graphType'];
    dateIntervalType = rcvData['dateIntervalType'];
    targetLineBeginDate = rcvData['targetLineBeginDate'];
    targetLineEndDate = rcvData['targetLineEndDate'];
    
    weights = rcvData['weights'];
    fats = rcvData['fats'];
    calories = rcvData['calories'];
}


/**
 * JSONデータを受信.
 * Android側から呼ばれる.
 * @param {String} json
 * @param {Boolean} doRefresh
 */
function nativeReceiveJsonData(json,doRefresh)
{
    beginLog('Begin nativeReceiveJsonData');
    nlog(json);
    var receiveData = JSON.parse(json);
    nlog(receiveData);
    
    setupFromAndroidData(receiveData);
    
    if(doRefresh){
        onLoaded();
    }
    
    endLog('End nativeReceiveJsonData');
}

 



function drawDebugLabel(text){
    $('#debug').text(text);
};

/**
 * 選択している領域を示す線の描画
 */
function drawPickLine(){
    $('#centerLine').css({
        'width'     : PICK_LINE_WIDTH,
        'height'    : '100%',
        'left'      : (dispWidth / 2) - (PICK_LINE_WIDTH / 2)
    });
};

/**
 * Y軸のラベルを描画（自力描画）
 * @param {Number} yAxisId Y軸のID
 * @param {String} value Y軸の値
 * @param {Boolean} opposite 右側に描画する
 * @param {String} color 色
 */
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


/**
 * X軸のラベルを取得
 * @param {Number} value milliseconds since Jan 1st 1970 
 * @returns {文字列}
 */
function getXAxisLabel(value)
{
    var date = new Date(value);
    
    // 日にちを算出
    var dayString = function(){
        return (date.getMonth()+1) + '/' + date.getDate();
    }();
    
    // 文字列をCSSスタイルをデコレートする
    var functor = function(color,string,bgcolor){
        return '<span style="color:'+color+'; background-color:'+bgcolor+';">'+string+'</span>';
    }   

    

    //土日だけ文字色を変更させる
    var result = function(){;
        var bgcolor = "#303020";
        if(date.getDay()===6){ // 土曜日
            return functor(XAXIS_LABEL_SAT_COLOR, dayString, bgcolor);
        }else if (date.getDay()===0){ // 日曜日
            return functor(XAXIS_LABEL_SUN_COLOR, dayString, bgcolor);
        }else{
            return functor(XAXIS_LABEL_DEFAULT_COLOR, dayString, bgcolor);
        }
    }();
    return result;
}





/**
 * JSONダミー取得
 * @returns {String} JSON
 */
function getDummyJsonString()
{
    var result = new Object();
    result['graphType'] = GRAPH_TYPE_COLUMN;
    result['dateIntervalType'] = 0;
    var now = new Date();
    now = new Date(now.getYear()+1900, now.getMonth(), now.getDate());
    
    result['targetLineBeginDate'] = now.getTime();
    result['targetLineEndDate'] = new Date().setDate(now.getDate() + 1);
    result['graphDataType'] = GRAPH_DATA_TYPE_CALORIE;
    result['calories'] = getDummyCalorie(now);
    result['fats'] = getDummyFat(now);
    result['weights'] = getDummyWeight(now);

    return JSON.stringify(result);
}

/**
 * 体重ダミー取得
 * @param {type} now
 * @returns {Array}
 */
function getDummyWeight(now)
{
    function getDay(day,now){
        var d = new Date(now);
        d.setFullYear(d.getFullYear()-1);
        d.setDate(day);
        return d.getTime();
    };
    
    var data = new Array;
    for(var i=0; i<DAY_RANGE; ++i){
        var weight = Math.floor(Math.random()*140) + 20;
        data[i] = [ getDay(i,now), weight ];
    }
    return data;
}

function getDummyFat(now)
{
    function getDay(day,now){
        var d = new Date(now);
        d.setFullYear(d.getFullYear()-1);
        d.setDate(day);
        return d.getTime();
    };
    
    var data = new Array;
    for(var i=0; i<DAY_RANGE; ++i){
        var weight = Math.floor(Math.random()*1000) / 10;
        data[i] = [ getDay(i,now), weight ];
    }
    return data;
}

function getDummyCalorie(now)
{
    var days = new Array;
    var currentDay = new Date(now);
    currentDay.setFullYear( currentDay.getFullYear()-1 );
    for(var i =0; i < DAY_RANGE; ++i){
//        days[i] = new Date(currentDay);
        days[i] = new Date(currentDay).getTime();
        currentDay.setDate( currentDay.getDate() + 1); //次の日へ
    }

    var color = 'pink';
    var data = new Array;
    for(var i=0; i<DAY_RANGE; i++){
        var weight = Math.floor(Math.random()*90000) / 10;
        data[i] = new Object;
        data[i] = { color : color, x : days[i], y : weight};
    }
    
    return data;
}

/**
 * 最小・最大・平均の取得
 * @param {type} datas
 * @param {type} isMap
 * @returns {getMinMaxAvg.Anonym$15}
 */
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