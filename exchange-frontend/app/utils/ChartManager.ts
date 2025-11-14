import {
  ColorType,
  createChart as createLightWeightChart,
  CrosshairMode,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

export class ChartManager {
  private candleSeries: ISeriesApi<"Candlestick">;
  private volumeSeries: ISeriesApi<"Histogram">;
  private lastUpdateTime = 0;
  private chart: any;
  private currentBar: {
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
  } = {
    open: null,
    high: null,
    low: null,
    close: null,
  };

  constructor(
    ref: any,
    initialData: any[],
    layout: { background: string; color: string }
  ) {
    // Create the main chart
    const chart = createLightWeightChart(ref, {
      autoSize: true,
      layout: {
        background: {
          type: ColorType.Solid,
          color: layout.background,
        },
        textColor: layout.color,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        visible: true,
        borderColor: "rgba(197, 203, 206, 0.3)",
      },
      timeScale: {
        borderColor: "rgba(197, 203, 206, 0.3)",
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        horzLines: {
          color: "rgba(197, 203, 206, 0.1)",
          visible: true,
        },
        vertLines: {
          color: "rgba(197, 203, 206, 0.1)",
          visible: true,
        },
      },
    });

    this.chart = chart;

    // Create candlestick series
    this.candleSeries = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceScaleId: "right",
    });

    // Create volume series with a separate price scale
    this.volumeSeries = chart.addHistogramSeries({
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });
    this.volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.5,
        bottom: 0,
      },
    });

    // Set the data for both series
    if (initialData && initialData.length > 0) {
      const candleData = initialData.map((data) => ({
        time: (data.timestamp.getTime() / 1000) as UTCTimestamp,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
      }));

      const volumeData = initialData.map((data) => ({
        time: (data.timestamp.getTime() / 1000) as UTCTimestamp,
        value: data.volume,
        color: data.close >= data.open ? "#26a69a40" : "#ef535040",
      }));

      this.candleSeries.setData(candleData);
      this.volumeSeries.setData(volumeData);
    }

    // Sync crosshair between price and volume
    chart.timeScale().fitContent();
  }

  public update(updatedPrice: any) {
    if (!this.lastUpdateTime) {
      this.lastUpdateTime = new Date().getTime();
    }

    const time = (this.lastUpdateTime / 1000) as UTCTimestamp;

    // Update candlestick data
    this.candleSeries.update({
      time: time,
      close: updatedPrice.close,
      low: updatedPrice.low,
      high: updatedPrice.high,
      open: updatedPrice.open,
    });

    // Update volume data
    if (updatedPrice.volume !== undefined) {
      this.volumeSeries.update({
        time: time,
        value: updatedPrice.volume,
        color:
          updatedPrice.close >= updatedPrice.open ? "#26a69a40" : "#ef535040",
      });
    }

    if (updatedPrice.newCandleInitiated) {
      this.lastUpdateTime = updatedPrice.time;
    }
  }

  public destroy() {
    this.chart.remove();
  }
}
