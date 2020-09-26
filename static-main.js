(async ($d3, $protobuf, $moment) => {
  const state = {};
  state.stockList = {};
  state.stockChanges = [];
  const intervalList = [1, 5, 15, 30];
  const margin = { top: 10, right: 30, bottom: 30, left: 60 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = $d3
    .select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  const drawChart = (data) => {
    let now = new Date(Date.now());
    const minTime = now.setHours(4, 30);
    now = new Date(Date.now());
    const maxTime = now.setHours(16, 0);
    // Add X axis --> it is a date format
    console.log('drawChart: data', data);
    const x = $d3
      .scaleTime()
      .domain([
        $d3.min(data, function (d) {
          return d.date;
        }),
        $d3.max(data, function (d) {
          return d.date;
        }),
      ])
      .range([0, width]);
    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call($d3.axisBottom(x));

    // Add Y axis
    const y = $d3
      .scaleLinear()
      .domain([
        $d3.min(data, function (d) {
          return +d.value - 0.05;
        }),
        $d3.max(data, function (d) {
          return +d.value + 0.05;
        }),
      ])
      .range([height, 0]);
    // const y = $d3
    //   .scaleLinear()
    //   .domain([
    //     $d3.min(data, function (d) {
    //       return +d.value - 0.05;
    //     }),
    //     $d3.max(data, function (d) {
    //       return +d.value + 0.05;
    //     }),
    //   ])
    //   .range([height, 0]);

    svg.append('g').call($d3.axisLeft(y));
  };

  const addStock = (data) => {
    // Add the line
    svg
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 1.5)
      .attr(
        'd',
        $d3
          .line()
          .x(function (d) {
            console.log('x(d.date)', x(d.date));
            return x(d.date);
          })
          .y(function (d) {
            console.log('y(d.value)', y(d.value));
            return y(d.value);
          })
      );
  };
  console.log('drawing Chart');
  drawChart();

  $d3.csv('stock_list.csv').then(function (stock_list) {
    // console.log('stock_list opening csv', stock_list);
    stock_list.forEach(async function (v) {
      // console.log(`${stock_list} ${v.Stocks}.json`);
      const data = await $d3.json(`${v.Stocks}.json`);
      console.log('data', data);
      const stockData = data.map((d) => {
        return {
          date: new Date(parseInt(d.time)),
          value: d.price,
        };
      });
      state.stockList[v.Stocks] = stockData;
      console.log('state.stockList', state.stockList);
      // addStock(stockData);
    });
  });
})(d3, protobuf, moment);
