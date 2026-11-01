import {
  average, collection, count, doc, getAggregateFromServer, getDocFromServer, getDocs, limit,
  orderBy, query, serverTimestamp, setDoc, where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Answers, Forecast } from "./model";
import { classifications, summarizeTypes, type TypeSummary } from "./community-summary";

export async function loadCommunityStats() {
  const simulations = collection(db, "simulations");
  const rows = await Promise.all(classifications.map(async (classification): Promise<TypeSummary> => {
    const matching = query(simulations, where("classification", "==", classification));
    const aggregate = await getAggregateFromServer(matching, { count: count(), averageDay: average("centerDay") });
    const data = aggregate.data();
    if (!data.count) return { classification, count: 0, averageDay: 0, minimumDay: 0, maximumDay: 0 };
    const [low, high] = await Promise.all([
      getDocs(query(matching, orderBy("centerDay", "asc"), limit(1))),
      getDocs(query(matching, orderBy("centerDay", "desc"), limit(1))),
    ]);
    return {
      classification, count: data.count, averageDay: data.averageDay!,
      minimumDay: low.docs[0].data().centerDay,
      maximumDay: high.docs[0].data().centerDay,
    };
  }));
  return summarizeTypes(rows);
}

export function newSubmissionId() {
  return doc(collection(db, "simulations")).id;
}

export async function shareSimulation(id: string, answers: Answers, forecast: Forecast) {
  const reference = doc(db, "simulations", id);
  // Reuse the ID after a lost acknowledgement, so a retry cannot add a duplicate.
  if ((await getDocFromServer(reference)).exists()) return;
  await setDoc(reference, {
    ...answers,
    classification: forecast.classification,
    centerDay: forecast.centerDayOfYear,
    innerStartDay: forecast.innerStartDayOfYear,
    innerEndDay: forecast.innerEndDayOfYear,
    createdAt: serverTimestamp(),
  });
}
