"use strict";

/**************************************************************
 * メソッド名について<br>
 * プレフィクスに'on'とつくメソッドは全てイベントハンドラになります。<br>
 * プレフィクスに'draw'とつくメソッドは全て表示するためのメソッドになります。<br>
 *************************************************************/

/******************************
 * テストデータ
 *****************************/
var weights;
var fats;

/******************************
 * 定数
 *****************************/
var ONE_DAY = 24 * 3600 * 1000;
var PICK_LINE_WIDTH = 5;
var XAXIS_WIDTH = 55; // X軸の要素幅(日づけの幅）
var CHART_MARGIN_SIDE = 30; // チャートの両サイドのマージン


/******************************
 * グローバル変数
 *****************************/
var chart;
var xAxis;
var now;
var dispWidth;
var dispHeight;
var targetLineBeginDate;    // 目標体重ラインの開始日
var targetLineEndDate;   // 目標体重ラインの終了日
var beginDate;
var endDate;
var containerWidth; // コンテナの幅



    

// エントリー関数
// ページがロードされた後に、グラフを出力する
document.body.onload = onLoaded();

/**
 * ページがロードされたら呼ばれます
 */
function onLoaded()
{
    console.log('Begin onPreInitializeGraph');
    onPreInitializeGraph();

    onInitializeGraph();
    
    onPostInitializeGraph();

    console.log('End onPreInitializeGraph');
}


/**
 * グラフの初期化前に呼ばれます
 */
function onPreInitializeGraph()
{
    console.log('Begin onPreInitializeGraph');

    now = truncateTime( new Date() );
    
    
    dispWidth  = $(document).width();
    dispHeight = $(document).height();
    console.log('dispWidth:'+dispWidth);
    
    // データの取得開始日と終了日を取得
    beginDate = now.getTime() - (365 * ONE_DAY);
    endDate   = now.getTime();

    
    // 目標線の開始時と終了時を取得
    targetLineBeginDate = truncateTime( new Date(2014, 1-1, 7) );
    targetLineEndDate = truncateTime( new Date(2014,  2-1, 14) );

    containerWidth = 2*CHART_MARGIN_SIDE + XAXIS_WIDTH * 365;
    $('#container').css('width', containerWidth );
    
    
    weights = getDummyWeight(now);
    fats = getDummyFat(now);
    
    
    
    console.log('End onPreInitializeGraph');
}

function truncateTime(date){
    var result = new Date(date.getYear()+1900, date.getMonth(), date.getDate());
    console.log(result.toLocaleString());
    return result;
}

/**
 * グラフの初期化
 */
function onInitializeGraph()
{
    console.log('Begin onInitializeGraph');

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
        credits : {
            enabled : false // Highchartクレジットを非表示
        },
        
        
        chart: {
            marginLeft:CHART_MARGIN_SIDE,
            marginRight:CHART_MARGIN_SIDE,
            renderTo: 'container',
            animation : false,
//            width : dispWidth * 2,
            
            events: {
                load : onChartLoad
            }
         
        },
        title: {
            text: null
        },
        tooltip: {
            enabled: false
        },
        
        scrollbar : {
            enabled : true
        },



        // X軸
        xAxis: {            
            alternateGridColor: '#f0f0ff',  // 1つおきのグリッド色
            type: 'datetime',               // 軸の値タイプ
            gridLineColor: "#dddddd",
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
            min: beginDate,
            max: endDate
        },



        // Y軸
        yAxis: [
            {// 体重. 表示してもスクロールすると見えなくなるため、全部非表示
                title : { text : null },
                gridLineDashStyle : 'dot', // 点線
                gridLineColor : '#101010',
                gridLineWidth : 0,
                offset : 0,     // 軸の位置
                lineWidth : 0, // Y軸の線
                labels : { enabled : false } // ラベル非表示
            },
            
            {// 体脂肪. 表示してもスクロールすると見えなくなるため、全部非表示
                title : { text : null },
                opposite : true,
                gridLineWidth:0,
                labels : { enabled : false }, // ラベル非表示
                max : 100
            }
        ],
                

    // データをハッシュに変換
        series: [
            {
                yAxis:0,
                name: '体重',
                zIndex : 1,
                color:'#fcb3bf',
                data: weights
//                [
//                    [getDay(1), 80],
//                    [getDay(2), 81],
//                    [getDay(3), 82],
//                    [getDay(4), 85],
//                    [getDay(5), 83],
//                    [getDay(6), 86],
//                    [getDay(7), 84]
//                ]
            },
            
            {// 体脂肪
                yAxis:1,
                name : '体脂肪',
                zIndex : 2,
                color:'#2020a0',
                data: fats
//                [
//                    [getDay(1), 30.0],
//                    [getDay(2), 30.1],
//                    [getDay(3), 23.2],
//                    [getDay(4), 30.5],
//                    [getDay(5), 30.3],
//                    [getDay(6), 30.6],
//                    [getDay(7), 30.4]
//                ]
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
        ]
    };

    // グラフを作成
    chart = new Highcharts.Chart(options);    

    console.log('End onInitializeGraph');
}

function getDay(day){
    var d = new Date(now);
    d.setDate(day);
    return d.getTime();
};


/**
 * グラフの初期化処理が呼ばれた後に呼ばれます<br>
 * グラフの読み込み処理が完了した場合は、{onChartLoad}になります。
 */
function onPostInitializeGraph()
{
    console.log('Begin onPostInitializeGraph');
    
    $(window).scroll(function(){
        var log = '';

        // スクロール位置をカーソルとし、ピッカーの位置にある日付を算出します
        var scrollLeft = $(window).scrollLeft();
        var pickPos = (scrollLeft-CHART_MARGIN_SIDE) + ((dispWidth / 2) - (PICK_LINE_WIDTH / 2));
        var rate = ONE_DAY / XAXIS_WIDTH;
        var ms = beginDate + (pickPos * rate);
        var date = new Date(ms);
        
        // 日付の前後をその日付を選択したことにしたいので、午後は次の日にする。
        if(date.getHours() > 12){
            date.setDate(date.getDate()+1);
        }
        date = truncateTime(date);
        
        log += ' Current Selected Date : ' + date.toLocaleString();
        console.log(log);
    });
    
 //   $(window).scrollLeft(29596); // スクロールを一番右へ移動,値超えても止まる.
    
    
    
    
    console.log('End onPostInitializeGraph');
}

/**
 * チャートの読み込みが完了したら呼ばれる
 * @param {} event
 */
function onChartLoad(event){
    console.log('Begin onChartLoad');

    // ピックラインの描画
    drawPickLine();
    
    // 体重用Y軸ラベルの描画
    var color = '#fcb3bf';
    var minMaxAvg = getMinMaxAvg(weights);
    drawYAxisLabel(0, minMaxAvg['min'], false,color); // 最小値
    drawYAxisLabel(0, minMaxAvg['avg'], false,color); // 平均値
    drawYAxisLabel(0, minMaxAvg['max'], false,color); // 最大値
    drawYAxisLabel(0, 50, false,color); // 目標値
    
    // 体脂肪用Y軸ラベルの描画
    color = '#2020a0';
    minMaxAvg = getMinMaxAvg(fats);
    drawYAxisLabel(1,minMaxAvg['min'],true,color); // 最小値
    drawYAxisLabel(1,minMaxAvg['avg'],true,color); // 平均値
    drawYAxisLabel(1,minMaxAvg['max'],true,color); // 最大値

    console.log('End onChartLoad');
}



/**
 * 選択している領域を示す線の描画
 */
function drawPickLine(){
    $('#centerLine').css({
        'width'     : PICK_LINE_WIDTH,
        'height'    : '100%',
        'left'      : (dispWidth / 2) - (PICK_LINE_WIDTH / 2)
    });
}

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
        'font-size' : 4,
        'position'  : 'fixed',
        'top'       : chart.yAxis[yAxisId].toPixels(value) - 5
    };
    cssAttr[opposite ? 'right' : 'left'] = 4;
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
    cssAttr[opposite ? 'right' : 'left'] = 23;
    var dashLine = $('<div>').css(cssAttr);
    $('#container').after(dashLine);
}


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

    //土日だけ文字色を変更させる
    var result = function(){;
        var bgcolor = "#303020";
        if(date.getDay()===6){ // 土曜日
            return getStringWithColor("#68ACE4", dayString, bgcolor);
        }else if (date.getDay()===0){ // 日曜日
            return getStringWithColor("#D9615C", dayString, bgcolor);
        }else{
            return getStringWithColor("#A1A5BA", dayString, bgcolor);
        }
    }();
    return result;
}



/**
 * 文字列を色付きに変換する<br>
 * 参考：<span style="color:#AAAAAA; background-color:#BBBBBB">aaaa</span>
 * @param {String} color
 * @param {String} string
 * @param {String} bgcolor
 * @returns {String}
 */
function getStringWithColor(color,string,bgcolor){
    return '<span style="color:'+color+'; background-color:'+bgcolor+';">'+string+'</span>';
}




