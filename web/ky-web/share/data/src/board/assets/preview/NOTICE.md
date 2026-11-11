# 组件预览静态资源

这些文件复用旧项目主程序 `communication/static-resources/js` 中已使用的浏览器脚本，保留运行代码、版权及许可声明；移除缺失源映射文件的引用，避免开发时读取不存在的 source map：

- ECharts 5.4.2 及 echarts-gl、echarts-liquidfill、echarts-wordcloud 扩展。
- D3 7.9.0。
- Observable Plot 0.6.15。

仅在组件测试 iframe 中按依赖顺序加载，不引入应用的全局作用域。更新时应同步检查扩展兼容性并保留许可信息。
