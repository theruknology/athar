import { Link } from "react-router-dom";
import type { RuleEval } from "../../api/types";
import { formatRatioPct } from "../../lib/format";
import { ruleName, useRules } from "../../lib/rules";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { Table, TBody, Td, TableWrap, THead, Th, Tr } from "../ui/Table";

/** Per-rule confusion counts at the High+ threshold (SPEC §17). */
export function RuleConfusionTable({ rows }: { rows: readonly RuleEval[] }) {
  const rules = useRules();

  if (rows.length === 0) {
    return <EmptyState compact title="No per-rule breakdown" description="The harness reported no per-rule counts." />;
  }

  return (
    <TableWrap>
      <Table>
        <THead>
          <tr>
            <Th>Rule</Th>
            <Th numeric>Positives (n)</Th>
            <Th numeric>True positives</Th>
            <Th numeric>False positives</Th>
            <Th numeric>False negatives</Th>
            <Th numeric>Precision</Th>
            <Th numeric>Recall</Th>
            <Th>Strength</Th>
          </tr>
        </THead>
        <TBody>
          {rows.map((row) => (
            <Tr key={row.rule_id}>
              <Td>
                <Link to={`/findings?rule=${row.rule_id}`} className="text-accent-strong hover:underline">
                  {row.rule_id}
                </Link>
                <span className="ml-1.5 text-fg-muted">{ruleName(rules, row.rule_id) ?? ""}</span>
              </Td>
              <Td numeric>{row.support}</Td>
              <Td numeric>{row.tp}</Td>
              <Td numeric>{row.fp}</Td>
              <Td numeric>{row.fn}</Td>
              {/* A ratio over no positives is not 0% — it is undefined, and must not print as a score. */}
              <Td numeric>{row.exercised ? formatRatioPct(row.precision) : "—"}</Td>
              <Td numeric>{row.exercised ? formatRatioPct(row.recall) : "—"}</Td>
              <Td>
                {!row.exercised ? (
                  <Badge tone="danger" title="No ground-truth positive in this estate: untested either way">
                    Not exercised
                  </Badge>
                ) : row.underpowered ? (
                  <Badge tone="warn" title="Too few positives for the ratio to be a measurement">
                    Under-powered
                  </Badge>
                ) : (
                  <Badge tone="ok" title="Enough positives for the ratio to carry weight">
                    Measured
                  </Badge>
                )}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </TableWrap>
  );
}
