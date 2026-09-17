"""Disposable issue-163 fixture: three explicitly authorized review choices."""
import hashlib
import json
from pathlib import Path

from orinoco_lite.annotations import annotation_companion, assertion_sha256
from orinoco_lite.candidates import Candidate, CandidatePlan
from orinoco_lite.decisions import load_decision_cache

AGENT = "xyzrins:source-adapters/issue-163-fixture/v1"
NAMESPACE = "https://example.org/orinoco/issue-163-fixture"


def build_candidate_plan(root: Path, *, trusted_root: Path, metadata_base: str):
    raw = (root / "site-specific/sources/dump-research-info/fixture.json").read_bytes()
    source = json.loads(raw)
    candidates = []
    for item in source:
        name = item["name"]
        pid = f"xyzrins:projects/adapter-fixture-{name}"
        assertion = {"schema_type": "dlthings:AttributeSpecification", "predicate": "schema:name", "value": item["title"]}
        proposed = {"schema_type": "xyzri:XYZProject", "pid": pid,
                    "title": item["title"], "display_label": item["title"], "attributes": [assertion]}
        companion = annotation_companion(pid, [{"path": "/attributes", "assertion_sha256": assertion_sha256(assertion),
            "pav:importedBy": AGENT, "pav:importedFrom": f"{NAMESPACE}/{name}"}])
        candidates.append(Candidate(source_namespace=NAMESPACE, source_record_id=name,
            pid=pid, record_path=f"adapter-fixture-{name}.yaml", baseline_record=None,
            proposed_record=proposed, baseline_companion=None, proposed_companion=companion,
            source_claim=item, record_root="site-specific/metadata/records",
            annotation_root="site-specific/metadata/overlays/annotations"))
    plan = CandidatePlan(adapter="dump-research-info", adapter_version="issue-163-fixture-v1", adapter_agent_pid=AGENT,
        source_namespace=NAMESPACE, source_coordinate={"fixture": "issue-163", "sha256": hashlib.sha256(raw).hexdigest()},
        metadata_base=metadata_base, candidates=candidates)
    cache = load_decision_cache(root / "site-specific/curation-records/dump-research-info.yaml", adapter=plan.adapter)
    from dataclasses import replace
    return replace(plan, candidates=cache.candidates_requiring_review(plan))
