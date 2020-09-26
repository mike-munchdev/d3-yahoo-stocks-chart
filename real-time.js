(async ($d3, $protobuf, $moment) => {
  const D3_CHART = {
    selector: '#chart',

    dataSource: [],
    stocks: [],
    data: [],
    svg: null,
    mainGroup: null,
    scaleX: null,

    options: {
      width: 640,
      height: 480,
      margins: {
        top: 20,
        right: 40,
        bottom: 20,
        left: 40,
      },
      MAX_LENGTH: 100,
      duration: 500,
      color: $d3.schemeCategory10,
    },

    init: function () {
      const el = $d3.select(this.selector);
      if (el.empty()) {
        console.warn(
          'init(): Element for "' + this.selector + '" selector not found'
        );
        return;
      }

      console.log('d3 version: ', $d3.version);

      this.seedData();

      this.draw();

      window.setInterval(this.updateData, D3_CHART.options.duration);
    },

    updateData: function () {
      const now = new Date();
      const lineData = {
        time: now,
        x: D3_CHART.randomNumberBounds(0, 5),
        y: D3_CHART.randomNumberBounds(0, 2.5),
        z: D3_CHART.randomNumberBounds(0, 10),
      };
      D3_CHART.dataSource.push(lineData);
      if (D3_CHART.dataSource.length > 30) {
        D3_CHART.dataSource.shift();
      }
      D3_CHART.draw();
    },

    draw: function () {
      const self = this;

      // Based on https://bl.ocks.org/mbostock/3884955
      self.data = ['x', 'y', 'z'].map(function (c) {
        return {
          label: c,
          values: self.dataSource.map(function (d) {
            return {
              time: +d.time,
              value: d[c],
            };
          }),
        };
      });

      const transition = $d3
          .transition()
          .duration(this.options.duration)
          .ease($d3.easeLinear),
        xScale = $d3
          .scaleTime()
          .rangeRound([
            0,
            this.options.width -
              this.options.margins.left -
              this.options.margins.right,
          ]),
        yScale = $d3
          .scaleLinear()
          .rangeRound([
            this.options.height -
              this.options.margins.top -
              this.options.margins.bottom,
            0,
          ]),
        zScale = $d3.scaleOrdinal(this.options.color);

      const xMin = $d3.min(self.data, function (c) {
        return $d3.min(c.values, function (d) {
          return d.time;
        });
      });
      const xMax = new Date(
        new Date(
          $d3.max(self.data, function (c) {
            return $d3.max(c.values, function (d) {
              return d.time;
            });
          })
        ).getTime() -
          2 * this.options.duration
      );
      //})).getTime());

      xScale.domain([xMin, xMax]);
      yScale.domain([
        $d3.min(self.data, function (c) {
          return $d3.min(c.values, function (d) {
            return d.value;
          });
        }),
        $d3.max(self.data, function (c) {
          return $d3.max(c.values, function (d) {
            return d.value;
          });
        }),
      ]);
      zScale.domain(
        self.data.map(function (c) {
          return c.label;
        })
      );

      const line = $d3
        .line()
        .curve($d3.curveBasis)
        .x(function (d) {
          return xScale(d.time);
        })
        .y(function (d) {
          return yScale(d.value);
        });

      const svg = $d3.select(this.selector).selectAll('svg').data([this.data]);
      const gEnter = svg
        .enter()
        .append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
        .attr('width', this.options.width)
        .attr('height', this.options.height)
        .append('g')
        .attr(
          'transform',
          'translate(' +
            this.options.margins.left +
            ',' +
            this.options.margins.top +
            ')'
        );
      gEnter.append('g').attr('class', 'axis x');
      gEnter.append('g').attr('class', 'axis y');

      gEnter
        .append('defs')
        .append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr(
          'width',
          this.options.width -
            this.options.margins.left -
            this.options.margins.right
        )
        .attr(
          'height',
          this.options.height -
            this.options.margins.top -
            this.options.margins.bottom
        );

      gEnter
        .append('g')
        .attr('class', 'lines')
        .attr('clip-path', 'url(#clip)')
        .selectAll('.data')
        .data(this.data)
        .enter()
        .append('path')
        .attr('class', 'data');

      const legendEnter = gEnter
        .append('g')
        .attr('class', 'legend')
        .attr(
          'transform',
          'translate(' +
            (this.options.width -
              this.options.margins.right -
              this.options.margins.left -
              75) +
            ',25)'
        );
      legendEnter
        .append('rect')
        .attr('width', 50)
        .attr('height', 75)
        .attr('fill', '#ffffff')
        .attr('fill-opacity', 0.7);
      legendEnter
        .selectAll('text')
        .data(this.data)
        .enter()
        .append('text')
        .attr('y', function (d, i) {
          return i * 20 + 25;
        })
        .attr('x', 5)
        .attr('fill', function (d) {
          return zScale(d.label);
        });

      const g = svg.select('g');

      g.select('g.axis.x')
        .attr(
          'transform',
          'translate(0,' +
            (this.options.height -
              this.options.margins.bottom -
              this.options.margins.top) +
            ')'
        )
        .transition(transition)
        .call($d3.axisBottom(xScale).ticks(5));

      g.select('g.axis.y')
        .transition(transition)
        .attr('class', 'axis y')
        .call($d3.axisLeft(yScale));

      g.select('defs clipPath rect')
        .transition(transition)
        .attr(
          'width',
          this.options.width -
            this.options.margins.left -
            this.options.margins.right
        )
        .attr(
          'height',
          this.options.height -
            this.options.margins.top -
            this.options.margins.bottom
        );

      g.selectAll('g path.data')
        .data(this.data)
        .style('stroke', function (d) {
          return zScale(d.label);
        })
        .style('stroke-width', 1)
        .style('fill', 'none')
        .transition()
        .duration(this.options.duration)
        .ease($d3.easeLinear)
        .on('start', tick);

      g.selectAll('g .legend text')
        .data(this.data)
        .text(function (d) {
          return (
            d.label.toUpperCase() + ': ' + d.values[d.values.length - 1].value
          );
        });

      // For transitions https://bl.ocks.org/mbostock/1642874
      function tick() {
        // Redraw the line.
        $d3
          .select(this)
          .attr('d', function (d) {
            return line(d.values);
          })
          .attr('transform', null);

        // Slide it to the left.
        const xMinLess = new Date(
          new Date(xMin).getTime() - D3_CHART.options.duration
        );
        $d3
          .active(this)
          .attr('transform', 'translate(' + xScale(xMinLess) + ',0)')
          .transition();
      }
    },

    clearChart: function () {
      const el = $d3.select(this.selector);
      if (el.empty()) {
        console.warn(
          'clearChart(): Element for "' + this.selector + '" selector not found'
        );
        return;
      }

      // clear element
      el.html('');
    },
    base64ToArray: (base64) => {
      const binary_string = window.atob(base64);
      const len = binary_string.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
      }
      return bytes;
    },
    addStock: (row) => {
      const { stock, lineColor } = row;

      if (!D3_CHART.stocks[stock]) {
        D3_CHART.stocks[stock] = row;
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
          const buffer = D3_CHART.base64ToArray(event.data);
          const data = PricingData.decode(buffer);
          // state.stockChanges.push(data);
          // console.log('state.stockList[stock]', state.stockList[stock]);
          const recordForTime = D3_CHART.dataSource.find(
            (s) => s.time === data.time && s.id === stock
          );
          console.log('data', data);
          D3_CHART.dataSource.push({
            time: data.time,
            [stock]: data.price,
          });
          console.log('D3_CHART.dataSource', D3_CHART.dataSource);
          D3_CHART.dataSource.push({
            time: new Date(
              now.getTime() -
                (this.options.MAX_LENGTH - i) * this.options.duration
            ),
            x: this.randomNumberBounds(0, 5),
            y: this.randomNumberBounds(0, 2.5),
            z: this.randomNumberBounds(0, 10),
          });
          //   state.stockChanges[stock] = [
          //     ...state.stockChanges[stock],
          //     {
          //       date: new Date(parseInt(data.time)),
          //       value: data.price,
          //     },
          //   ];
          //   this.update
        };

        stockSocket.onclose = (event) => {
          console.log('On close event', event);
        };
      }
    },
    seedData: function () {
      //   $d3.csv('stock_list.csv').then(function (stock_list) {
      //     console.log('stock_list opening csv');
      //     stock_list.forEach(function (v) {
      //       // console.log('v', v);
      //       D3_CHART.addStock(v);
      //     });
      //   });
      const now = new Date();
      for (let i = 0; i < this.options.MAX_LENGTH; ++i) {
        this.dataSource.push({
          time: new Date(
            now.getTime() -
              (this.options.MAX_LENGTH - i) * this.options.duration
          ),
          x: this.randomNumberBounds(0, 5),
          y: this.randomNumberBounds(0, 2.5),
          z: this.randomNumberBounds(0, 10),
        });
      }
    },

    randomNumberBounds: function (min, max) {
      return Math.floor(Math.random() * max) + min;
    },
  };

  D3_CHART.init();
})(d3, protobuf, moment);
