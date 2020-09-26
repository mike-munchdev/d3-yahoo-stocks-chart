(async ($d3, $protobuf, $moment) => {
  const state = {};
  state.stockList = {};
  state.stockChanges = {};
  const intervalList = [1, 5, 15, 30];
  const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  const svg = $d3
    .select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const base64ToArray = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  };

  let now = new Date(Date.now());
  const minTime = now.setHours(4, 30);
  now = new Date(Date.now());
  const maxTime = now.setHours(16, 0);

  const x = $d3.scaleTime().domain([minTime, maxTime]).range([0, width]);
  const y = $d3.scaleLinear().domain([0, 3000]).range([height, 0]);

  // Add X axis --> it is a date format

  svg
    .append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call($d3.axisBottom(x));

  // Add Y axis

  svg.append('g').call($d3.axisLeft(y));

  const updateStockLines = (stock) => {
    // Add the line

    state.stockChanges[stock].forEach((list) => {
      console.log('list', list);
      svg
        .append('path')
        .datum(list)
        .attr('fill', 'none')
        .attr('stroke', state.stockList[stock].lineColor)
        .attr('stroke-width', 1.5)
        .attr(
          'd',
          $d3
            .line()
            .x(function (d) {
              console.log('x(d.date)', x(new Date(d.date)));
              return x(d.date);
            })
            .y(function (d) {
              console.log('y(d.value)', y(d.value));
              return y(d.value);
            })
        );
    });
  };

  const addStock = (row) => {
    const { stock, lineColor } = row;

    if (!state.stockList[stock]) state.stockList[stock] = row;
    if (!state.stockChanges[stock]) state.stockChanges[stock] = [];

    const stockSocket = new WebSocket('wss://streamer.finance.yahoo.com/');

    stockSocket.onopen = (event) => {
      console.log('socket opened');
      const send = '{"subscribe":["' + stock + '"]}';
      stockSocket.send(send);
    };

    stockSocket.onmessage = (event) => {
      //https://stackoverflow.com/questions/59321908/decode-websocket-received-data
      console.log('onMessage');
      const PricingData = $protobuf.roots.default.quotefeeder.PricingData;
      const buffer = base64ToArray(event.data);
      const data = PricingData.decode(buffer);
      // state.stockChanges.push(data);
      // console.log('state.stockList[stock]', state.stockList[stock]);

      state.stockChanges[stock] = [
        ...state.stockChanges[stock],
        {
          date: new Date(parseInt(data.time)),
          value: data.price,
        },
      ];
      updateStockLines(stock);
    };

    stockSocket.onclose = (event) => {
      console.log('On close event', event);
    };
  };

  $d3.csv('stock_list.csv').then(function (stock_list) {
    console.log('stock_list opening csv');
    stock_list.forEach(function (v) {
      // console.log('v', v);
      addStock(v);
    });
  });
})(d3, protobuf, moment);
