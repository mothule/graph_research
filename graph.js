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
var calories;

/******************************
 * 定数
 *****************************/
var ONE_DAY                     = 24 * 3600 * 1000; //!< 1日のミリ秒
var PICK_LINE_WIDTH             = 4;                //!< ピッカー線の太さ
var XAXIS_WIDTH                 = 56;               //!< X軸の要素幅(日づけ間の幅）
var CHART_MARGIN_SIDE           = 30;               //!< チャートの両サイドのマージン
var COLUMN_MARGIN_SIDE          = 26;               //!< 棒グラフのみ発生するマージンの幅
var DAY_RANGE                   = 365;              //!< グラフの表示範囲
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


/******************************
 * グローバル変数
 *****************************/
var chart;                  //!< チャートインスタンス
var now;                    //!< 今の日付（年、月、日のみ）
var dispWidth;              //!< ブラウザの幅
var dispHeight;             //!< ブラウザの高さ
var targetLineBeginDate;    //!< 目標体重ラインの開始日
var targetLineEndDate;      //!< 目標体重ラインの終了日
var beginDate;              //!< データの取得開始日
var endDate;                //!< データの取得終了日
var contentWidth;           //!< コンテナの幅


// エントリー関数
// ページがロードされた後に、グラフを出力する
document.body.onload = onLoaded();

/**
 * ページがロードされたら呼ばれます
 */
function onLoaded()
{
    beginLog('Begin onLoaded');
    
    onPreInitializeGraph();

    onInitializeGraph();
    
    onPostInitializeGraph();

    endLog('End onLoaded');
}

/**
 * グラフの初期化前に呼ばれます
 */
function onPreInitializeGraph()
{
    beginLog('Begin onPreInitializeGraph');

    // 現在日の取得
    now = truncateTime( new Date() );

    // ブラウザの幅・高さを取得
    dispWidth  = $(document).width();
    dispHeight = $(document).height();
    
    // データの取得開始日と終了日を取得
    beginDate = new Date( now.getTime() - (DAY_RANGE * ONE_DAY) );
    endDate   = new Date( now.getTime() );
    
    // 目標線の開始時と終了時を取得
    targetLineBeginDate = truncateTime( new Date(2014, 1-1, 7) );
    targetLineEndDate = truncateTime( new Date(2014,  2-1, 14) );

    // コンテンツ幅：棒グラフマージン、チャートマージン、チャート幅
    contentWidth = COLUMN_MARGIN_SIDE + 2*CHART_MARGIN_SIDE + XAXIS_WIDTH * DAY_RANGE;
    $('#container').css('width', contentWidth );

    var log = '';
    log += 'ブラウザ幅・高さ:'+dispWidth+','+dispHeight+'\n';
    log += 'データ取得の開始と終了日:'+beginDate.toLocaleString()+' : '+endDate.toLocaleString() +'\n';
    log += 'コンテンツ幅:'+contentWidth+'\n';
    nlog(log);
    
    // テストデータ構築
    weights = getDummyWeight(now);
    fats = getDummyFat(now);
    calories = getDummyCalorie(now);

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
                title : { text : null },
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
            },
            
            {// 消費カロリー, 表示してもスクロールすると見えなくなるため、全部非表示
                title : { text : null },
                gridLineWidth:0,
                labels : { enabled : false } // ラベル非表示
            }
        ],
                

    // データをハッシュに変換
        series: [
//            {// 体重
//                yAxis:0,
//                name: '体重',
//                zIndex : 1,
//                color:'#fcb3bf',
//                data: weights
//            },
//            
//            {// 体脂肪
//                yAxis:1,
//                name : '体脂肪',
//                zIndex : 2,
//                color:'#2020a0',
//                data: fats
//            },
//            {// 目標日までの理想線を破線ピンク色で表示
//                yAxis:0,
//                name : '目標線',
//                color : 'pink',
//                dashStyle : 'dot',
//                marker:{ radius:3 },
//                zIndex : 0,
//                data:[84, 50],
//                pointStart      : targetLineBeginDate.getTime(),
//                pointInterval   : targetLineEndDate.getTime() - targetLineBeginDate.getTime()
//            },
            {// 消費カロリー
                yAxis:2,
                name : CALORIE_COLUMN_NAME,
                color : CALORIE_COLUMN_COLOR,
                type : 'column',
                data : calories
            }            
        ]
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
    
    
    
    // 体重用Y軸ラベルの描画
    
    var color = YAXIS_WEIGHT_LABEL_COLOR;
    var minMaxAvg = getMinMaxAvg(weights);
    drawYAxisLabel(0, minMaxAvg['min'], false, color); // 最小値
    drawYAxisLabel(0, minMaxAvg['avg'], false, color); // 平均値
    drawYAxisLabel(0, minMaxAvg['max'], false, color); // 最大値
    drawYAxisLabel(0, 50, false,color); // 目標値
    
    // 体脂肪用Y軸ラベルの描画
    color = YAXIS_FAT_LABEL_COLOR;
    minMaxAvg = getMinMaxAvg(fats);
    drawYAxisLabel(1,minMaxAvg['min'],true, color); // 最小値
    drawYAxisLabel(1,minMaxAvg['avg'],true, color); // 平均値
    drawYAxisLabel(1,minMaxAvg['max'],true, color); // 最大値


    // 消費カロリー用Y軸ラベルの描画
    color = YAXIS_CALORIE_LABEL_COLOR;
    minMaxAvg = getMinMaxAvg(calories,true);
    drawYAxisLabel(2,minMaxAvg['min'],false, color); // 最小値
    drawYAxisLabel(2,minMaxAvg['avg'],false, color); // 平均値
    drawYAxisLabel(2,minMaxAvg['max'],false, color); // 最大値

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
    var rate = ONE_DAY / (XAXIS_WIDTH-0.091); // 棒グラフだと原因不明でズレてしまう。
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
    log += '選択しているグラフデータ配列のIndex:'+index+'\n';

    // 指定のグラフを選択状態にする
    var series = chart.series[0];
    var data = series.data[index];
    if(!data.selected){
        data.select();
    }

    drawDebugLabel(date.toLocaleString());
    nlog(log);
}



function drawDebugLabel(text){
    $('#debug').text(text);
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
            return getStringWithColor(XAXIS_LABEL_SAT_COLOR, dayString, bgcolor);
        }else if (date.getDay()===0){ // 日曜日
            return getStringWithColor(XAXIS_LABEL_SUN_COLOR, dayString, bgcolor);
        }else{
            return getStringWithColor(XAXIS_LABEL_DEFAULT_COLOR, dayString, bgcolor);
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




