export const AskTable = ({ asks }: { asks: [string, string][] }) => {
  let curr_total = 0;
  const recent_asks = asks.slice(0, 9);

  const ask_rows: [string, string, number][] = [];
  for (const ask of recent_asks) {
    const [price, size] = ask;
    curr_total += Number(size);
    ask_rows.push([price, size, curr_total]);
  }
  ask_rows.reverse();
  const sumTotal = recent_asks.reduce(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (acc, [_, size]) => acc + Number(size),
    0
  );
  return (
    <div className="space-y-1">
      {ask_rows.map(([price, size, total]) => (
        <Ask
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

function Ask({
  sumTotal,
  price,
  size,
  total,
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
          background: "rgba(234,56,59,.12)",
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
          background: "rgba(234,56,59,.5)",
          transition: "width 0.3s ease-in-out",
          zIndex: 2,
        }}
      ></div>

      <div className="flex justify-between text-xs w-full z-10 relative px-2">
        <div className="text-red-400 font-semibold">{price}</div>
        <div>{size}</div>
        <div className="font-medium">{total.toFixed(2)}</div>
      </div>
    </div>
  );
}
