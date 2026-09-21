import { describe, it } from "vitest";
import { buildScene } from "@/lib/graph/scene";
import { seed } from "@/lib/graph/seed";

type V = [number, number, number];
const sub = (a: V, b: V): V => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const dot = (a: V, b: V) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a: V, b: V): V => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = (a: V): V => { const l = Math.hypot(...a)||1; return [a[0]/l,a[1]/l,a[2]/l]; };

const FOV = 62, MARGIN = 1.06, MIN_ORBIT = 23;
const UP: V = [0,1,0];

describe("probe", () => {
  it("reports framing", () => {
    const scene = buildScene(seed);
    const nodes = scene.nodes;
    const ring = nodes.filter(n => n.depth === 1);
    const first = ring[0]!;
    const az = Math.atan2(first.position[2], first.position[0]) + Math.PI / ring.length;
    const polar = Math.PI * 0.3;
    const dir: V = [Math.sin(polar)*Math.cos(az), Math.cos(polar), Math.sin(polar)*Math.sin(az)];

    const forward = norm([-dir[0],-dir[1],-dir[2]]);
    const right = norm(cross(forward, UP));
    const up = norm(cross(right, forward));

    for (const [label, w, h] of [["desktop 1728x900", 1728, 900], ["tablet portrait 834x1112", 834, 1112]] as const) {
      const tanV = Math.tan(FOV*Math.PI/360), tanH = tanV*(w/h);
      const fit = (target: V) => {
        let d = MIN_ORBIT;
        for (const n of nodes) {
          const p = sub(n.position as V, target);
          const depth = dot(p, forward);
          d = Math.max(d, (Math.abs(dot(p,right))+n.radius)/tanH - depth, (Math.abs(dot(p,up))+n.radius)/tanV - depth);
        }
        return d * MARGIN;
      };
      // iterative: NDC centre -> world shift -> refit
      const ndcBox = (d: number, t: V) => {
        let l=Infinity,r2=-Infinity,b=Infinity,tp=-Infinity;
        for (const n of nodes) {
          const p = sub(n.position as V, t);
          const depth = d + dot(p, forward);
          l=Math.min(l,(dot(p,right)-n.radius)/(depth*tanH)); r2=Math.max(r2,(dot(p,right)+n.radius)/(depth*tanH));
          b=Math.min(b,(dot(p,up)-n.radius)/(depth*tanV)); tp=Math.max(tp,(dot(p,up)+n.radius)/(depth*tanV));
        }
        return {l,r2,b,tp};
      };
      let target: V = [0,0,0];
      let d = fit(target);
      for (let i=0;i<6;i+=1) {
        const {l,r2,b,tp} = ndcBox(d, target);
        const cx = (l+r2)/2, cy = (b+tp)/2;
        const sx = cx * tanH * d, sy = cy * tanV * d;
        target = [target[0]+right[0]*sx+up[0]*sy, target[1]+right[1]*sx+up[1]*sy, target[2]+right[2]*sx+up[2]*sy];
        d = fit(target);
        const box = ndcBox(d, target);
        console.log(`   iter ${i}: |t|=${Math.hypot(...target).toFixed(2)} d=${d.toFixed(1)} x=[${box.l.toFixed(2)},${box.r2.toFixed(2)}] y=[${box.b.toFixed(2)},${box.tp.toFixed(2)}]`);
      }
      const dOld = fit([0,0,0]), dNew = d;
      // how much of the frame the content fills, vertically and horizontally
      const fill = (d: number, t: V) => {
        let l=Infinity,r2=-Infinity,b=Infinity,tp=-Infinity;
        for (const n of nodes) {
          const p = sub(n.position as V, t);
          const depth = d + dot(p, forward);
          l=Math.min(l,(dot(p,right)-n.radius)/(depth*tanH)); r2=Math.max(r2,(dot(p,right)+n.radius)/(depth*tanH));
          b=Math.min(b,(dot(p,up)-n.radius)/(depth*tanV)); tp=Math.max(tp,(dot(p,up)+n.radius)/(depth*tanV));
        }
        return { x: [l.toFixed(2), r2.toFixed(2)], y: [b.toFixed(2), tp.toFixed(2)],
                 area: (((r2-l)/2)*((tp-b)/2)).toFixed(3) };
      };
      console.log(label, "| target offset", Math.hypot(...target).toFixed(2),
        "| dist old", dOld.toFixed(1), "new", dNew.toFixed(1));
      console.log("   old NDC", JSON.stringify(fill(dOld, [0,0,0])));
      console.log("   new NDC", JSON.stringify(fill(dNew, target)));
      console.log("   camera |origin| new:", Math.hypot(target[0]+dir[0]*dNew, target[1]+dir[1]*dNew, target[2]+dir[2]*dNew).toFixed(1));
    }
  });
});
