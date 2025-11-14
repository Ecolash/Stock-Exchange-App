export const BidTable = ({ bids }: { bids: [string, string][] }) => {
  let curr_total = 0;
  const recent_bids = bids.slice(0, 9);

  const bid_rows: [string, string, number][] = [];
  for (const bid of recent_bids) {
    const [price, size] = bid;
    curr_total += Number(size);
    bid_rows.push([price, size, curr_total]);
  }
  const sumTotal = recent_bids.reduce(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (acc, [_, size]) => acc + Number(size),
    0
  );
  return (
    <div className="space-y-1">
      {bid_rows.map(([price, size, total]) => (
        <Bid
          sumTotal={sumTotal}
          key={price}
          price={price}
          size={size}
          total={total}
        />
      ))}
    </div>
  );
};

function Bid({
  price,
  size,
  total,
  sumTotal,
}: {
  sumTotal: number;
  price: string;
  size: string;
  total: number;
}) {
  const totalPercentage = (total / sumTotal) * 100;
  const sizePercentage = (Number(size) / sumTotal) * 100;

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        backgroundColor: "transparent",
        overflow: "hidden",
        padding: "4px 0",
        height: "20px",
      }}
    >
      {/* Total value bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${totalPercentage}%`,
          height: "100%",
          background: "rgba(0,194,120,.12)",
          transition: "width 0.3s ease-in-out",
          zIndex: 1,
        }}
      ></div>

      {/* Size percentage bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: `${sizePercentage}%`,
          height: "100%",
          background: "rgba(0,194,120,.4)",
          transition: "width 0.3s ease-in-out",
          zIndex: 2,
        }}
      ></div>

      <div className="flex justify-between text-xs w-full z-10 relative px-2">
        <div className="font-semibold text-green-400">{price}</div>
        <div>{size}</div>
        <div className="font-medium">{total.toFixed(2)}</div>
      </div>
    </div>
  );
}
