/**
 * The color of the browser's own bars, such as a phone's address bar: the background of the
 * theme the page shows. It is read from the --ws-color-bg token where the stylesheet sets it,
 * on <html>, so it is the token's value in whatever theme applies, with no copy of it here.
 *
 * Every <meta name="theme-color"> of the page gets it, and a page that has none gets one.
 */

const TAGS = 'meta[name="theme-color"]'
const TOKEN = '--ws-color-bg'

/**
 * A script for the <head> that keeps the theme-color tags in step from the first paint on:
 * when the stylesheet is there, whenever data-theme or the class of <html> changes, whoever
 * changes it, and when the system's theme changes. The first paint waits for the stylesheets in the
 * <head>, and so does the first animation frame.
 */
export const themeColorScript = `(function(){var d=document,r=d.documentElement;function p(){var c=getComputedStyle(r).getPropertyValue(${JSON.stringify(TOKEN)}).trim(),m=d.querySelectorAll(${JSON.stringify(TAGS)});if(!c)return;if(!m.length){m=[d.createElement('meta')];m[0].name='theme-color';d.head.appendChild(m[0])}for(var i=0;i<m.length;i++)m[i].content=c}new MutationObserver(p).observe(r,{attributeFilter:['data-theme','class']});matchMedia('(prefers-color-scheme: light)').addEventListener('change',p);requestAnimationFrame(p);addEventListener('load',p)})()`
