package jp.mothule.graph_research;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.view.Menu;
import android.view.ViewGroup.LayoutParams;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * 
 * @author mothule
 * 
 */
public class MainActivity extends Activity {

	private WebView webView;

	@SuppressLint("SetJavaScriptEnabled")
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);

		webView = new WebView(this);
		LayoutParams params = new LayoutParams(LayoutParams.MATCH_PARENT,
				LayoutParams.MATCH_PARENT);
		addContentView(webView, params);

		WebSettings settings = webView.getSettings();
		settings.setJavaScriptEnabled(true);

		webView.loadUrl("file:///android_asset/graph/graph.html");
	}

	@Override
	protected void onDestroy() {
		super.onDestroy();
		webView.stopLoading();
		webView.setWebChromeClient(null);
		webView.setWebViewClient(null);
		webView.destroy();
		webView = null;
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.main, menu);
		return true;
	}

}
