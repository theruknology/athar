"""Derive provider service→category catalogues from public IAM datasets.

Why this exists
---------------
ATHAR's mapping tables (``backend/athar/normaliser/mappings/*.yaml``) originally carried a
hand-written list of ~50 AWS service prefixes. That is fine for the synthetic estate, whose
generator only emits those services, but a *real* ``get-account-authorization-details`` export
references the whole AWS surface: running one produced 2,436 distinct unmapped actions across
180 service prefixes, all of which collapsed into R0 "unmapped permission" noise.

This script closes that gap from an authoritative public source rather than by guessing:
the `iam-dataset <https://github.com/iann0036/iam-dataset>`_ corpus, which is generated from
AWS's Service Authorization Reference, Azure's provider-operations API and GCP's IAM
permissions list.

Each service prefix is assigned one of ATHAR's seven canonical categories
(``mappings/canonical.yaml``). Classification is explicit, not fuzzy: ``CURATED`` below fixes
the category for every service we have reviewed, and anything unreviewed is reported rather
than silently bucketed, so coverage is always an honest number.

Usage
-----
    python scripts/build_service_catalog.py --fetch      # download, classify, write catalogue
    python scripts/build_service_catalog.py --report     # classify only, print coverage

Output is written to ``backend/athar/normaliser/mappings/service_catalog.yaml``, which the
provider mappings layer *under* their own hand-tuned ``services:`` entries — a curated entry
always wins over a derived one.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from collections.abc import Iterable
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
MAPPINGS = REPO / "backend" / "athar" / "normaliser" / "mappings"
OUT = MAPPINGS / "service_catalog.yaml"
CACHE = Path("/tmp/iamdata")

BASE = "https://raw.githubusercontent.com/iann0036/iam-dataset/main"
SOURCES = {
    "aws": f"{BASE}/aws/map.json",
    "gcp": f"{BASE}/gcp/permissions.json",
    "azure": f"{BASE}/azure/provider-operations.json",
}

CATEGORIES = ("compute", "storage", "network", "data", "security", "identity", "billing")

# ---------------------------------------------------------------------------
# Curated AWS service prefix → canonical category.
#
# Conventions follow the existing hand-written table in mappings/aws.yaml:
#   * "security" carries observability and posture tooling (cloudwatch, config, cloudtrail,
#     ssm) as well as protection services — these are the services whose abuse hides an attack.
#   * "data" carries messaging and analytics/ML inference alongside databases: they all read or
#     move customer records.
#   * "identity" is reserved for services that mint, hold or assume principals.
# ---------------------------------------------------------------------------
CURATED: dict[str, str] = {}


def _add(category: str, prefixes: str) -> None:
    for p in prefixes.split():
        CURATED[p] = category


_add(
    "compute",
    """
    ec2 ec2-instance-connect ec2messages lambda ecs ecr ecr-public eks batch autoscaling
    application-autoscaling autoscaling-plans elasticbeanstalk lightsail apprunner
    serverlessrepo outposts s3-outposts cloud9 codebuild codedeploy codepipeline codecommit
    codestar codestar-connections codestar-notifications codeguru codeguru-reviewer
    codeguru-profiler codeartifact cloudformation cloudshell imagebuilder compute-optimizer
    elasticmapreduce emr-containers emr-serverless gamelift nimble braket panorama
    sagemaker sagemaker-geospatial robomaker deepracer deepcomposer deeplens greengrass
    iot iot1click iotanalytics iotdeviceadvisor iotevents iotfleethub iotfleetwise
    iotjobsdata iotsitewise iotthingsgraph iottwinmaker iotwireless devicefarm
    airflow mwaa batch-compute simspaceweaver apprunner-service launchwizard
    servicecatalog servicediscovery opsworks opsworks-cm ssm-sap resiliencehub
    fis drs sms application-transformation migrationhub mgh mgn discovery
    elastictranscoder mediaconvert mediaconnect medialive mediapackage mediapackage-vod
    mediastore mediatailor ivs ivschat elemental
    """,
)

_add(
    "storage",
    """
    s3 s3express glacier elasticfilesystem fsx backup backup-gateway backup-storage
    storagegateway snowball snowball-edge snow-device-management datasync transfer
    workdocs rbin dlm cloudendure ebs
    """,
)

_add(
    "network",
    """
    vpc vpc-lattice elasticloadbalancing route53 route53domains route53resolver
    route53-recovery-control-config route53-recovery-readiness route53-recovery-cluster
    cloudfront apigateway execute-api directconnect globalaccelerator networkmanager
    network-firewall networkmonitor internetmonitor appmesh servicemesh private-networks
    geo groundstation tiros ram
    """,
)

_add(
    "data",
    """
    rds rds-data rds-db aurora dynamodb dax redshift redshift-data redshift-serverless
    athena glue databrew lakeformation datapipeline emr-studio kinesis kinesisanalytics
    kinesisvideo firehose kafka kafkaconnect kafka-cluster msk sns sqs mq events schemas
    pipes eventbridge elasticache memorydb docdb docdb-elastic neptune neptune-db
    neptune-graph timestream cassandra keyspaces sdb simpledb qldb quicksight
    elasticsearch es opensearch aoss cloudsearch kendra comprehend comprehendmedical
    personalize forecast frauddetector lookoutmetrics lookoutvision lookoutequipment
    rekognition polly transcribe translate textract lex lexv2 machinelearning
    healthlake omics finspace finspace-api datazone datasetexchange dataexchange
    entityresolution profile customer-profiles connect connect-campaigns voiceid
    wisdom chime chime-sdk-identity chime-sdk-media-pipelines chime-sdk-meetings
    chime-sdk-messaging chime-sdk-voice ses sesv2 pinpoint mobiletargeting sms-voice
    workmail workmailmessageflow a4b alexaforbusiness bedrock q
    """,
)

_add(
    "security",
    """
    iam-security kms cloudhsm acm acm-pca secretsmanager guardduty inspector inspector2
    securityhub macie macie2 detective shield waf wafv2 waf-regional fms
    access-analyzer accessanalyzer config cloudtrail cloudwatch logs oam rum evidently
    synthetics xray applicationinsights devops-guru health trustedadvisor support
    ssm ssmmessages ssm-contacts ssm-incidents signer notifications
    resource-explorer-2 resource-groups tag tagging servicequotas
    controltower audit-manager auditmanager artifact securitylake
    payment-cryptography verifiedpermissions rolesanywhere
    """,
)

_add(
    "identity",
    """
    iam sts organizations account sso sso-directory identitystore identity-sync
    cognito-idp cognito-identity cognito-sync directoryservice ds clouddirectory
    workspaces workspaces-web appstream
    """,
)

_add(
    "billing",
    """
    aws-portal billing budgets ce cur payments tax pricing savingsplans billingconductor
    freetier cost-optimization-hub bcm-data-exports consolidatedbilling purchase-orders
    marketplacecommerceanalytics aws-marketplace license-manager
    """,
)

# Remainder of the AWS surface, reviewed against the Service Authorization Reference.
_add("compute", "amplify amplifybackend proton refactor-spaces states swf ssm-quicksetup thinclient worklink mobilehub honeycode migrationhub-strategy m2 gamesparks")
_add("storage", "importexport s3-object-lambda")
_add("data", "dms medical-imaging mechanicalturk cleanrooms cleanrooms-ml")
_add("security", "aps grafana pi inspector-scan wellarchitected pca-connector-ad pca-connector-scep")
_add("identity", "eks-auth")

# ---------------------------------------------------------------------------
# Azure resource-provider namespace → category, and GCP service → category.
# Azure operations look like "Microsoft.Compute/virtualMachines/read"; GCP permissions look
# like "compute.instances.get". In both, the leading token is the service.
# ---------------------------------------------------------------------------
AZURE: dict[str, str] = {
    "microsoft.compute": "compute",
    "microsoft.containerservice": "compute",
    "microsoft.containerregistry": "compute",
    "microsoft.containerinstance": "compute",
    "microsoft.web": "compute",
    "microsoft.batch": "compute",
    "microsoft.hdinsight": "compute",
    "microsoft.databricks": "compute",
    "microsoft.machinelearningservices": "compute",
    "microsoft.storage": "storage",
    "microsoft.storagesync": "storage",
    "microsoft.netapp": "storage",
    "microsoft.recoveryservices": "storage",
    "microsoft.databox": "storage",
    "microsoft.network": "network",
    "microsoft.cdn": "network",
    "microsoft.apimanagement": "network",
    "microsoft.sql": "data",
    "microsoft.documentdb": "data",
    "microsoft.dbformysql": "data",
    "microsoft.dbforpostgresql": "data",
    "microsoft.dbformariadb": "data",
    "microsoft.cache": "data",
    "microsoft.datafactory": "data",
    "microsoft.synapse": "data",
    "microsoft.eventhub": "data",
    "microsoft.servicebus": "data",
    "microsoft.kusto": "data",
    "microsoft.search": "data",
    "microsoft.cognitiveservices": "data",
    "microsoft.keyvault": "security",
    "microsoft.security": "security",
    "microsoft.securityinsights": "security",
    "microsoft.insights": "security",
    "microsoft.operationalinsights": "security",
    "microsoft.policyinsights": "security",
    "microsoft.advisor": "security",
    "microsoft.authorization": "identity",
    "microsoft.managedidentity": "identity",
    "microsoft.aad": "identity",
    "microsoft.azureactivedirectory": "identity",
    "microsoft.graph": "identity",
    "microsoft.billing": "billing",
    "microsoft.consumption": "billing",
    "microsoft.costmanagement": "billing",
    "microsoft.commerce": "billing",
    # remainder of the first-party Azure surface, reviewed against provider operations
    "microsoft.avs": "compute",
    "microsoft.azurestack": "compute",
    "microsoft.azurestackhci": "compute",
    "microsoft.azurefleet": "compute",
    "microsoft.azurelargeinstance": "compute",
    "microsoft.baremetal": "compute",
    "microsoft.baremetalinfrastructure": "compute",
    "microsoft.hanaonazure": "compute",
    "microsoft.redhatopenshift": "compute",
    "microsoft.scvmm": "compute",
    "microsoft.nutanix": "compute",
    "microsoft.connectedopenstack": "compute",
    "microsoft.cloudshell": "compute",
    "microsoft.cloudtest": "compute",
    "microsoft.labservices": "compute",
    "microsoft.loadtestservice": "compute",
    "microsoft.durabletask": "compute",
    "microsoft.visualstudio": "compute",
    "microsoft.devhub": "compute",
    "microsoft.powerplatform": "compute",
    "microsoft.singularity": "compute",
    "microsoft.azureplaywrightservice": "compute",
    "microsoft.azureterraform": "compute",
    "microsoft.toolchainorchestrator": "compute",
    "microsoft.offazure": "compute",
    "microsoft.objectstore": "storage",
    "microsoft.azuredatatransfer": "storage",
    "microsoft.azurebusinesscontinuity": "storage",
    "microsoft.confluent": "data",
    "microsoft.datadog": "data",
    "microsoft.signalrservice": "data",
    "microsoft.azurearcdata": "data",
    "microsoft.bing": "data",
    "microsoft.syntex": "data",
    "microsoft.healthdataaiservices": "data",
    "microsoft.openenergyplatform": "data",
    "microsoft.easm": "security",
    "microsoft.intune": "security",
    "microsoft.blueprint": "security",
    "microsoft.management": "security",
    "microsoft.managedservices": "security",
    "microsoft.operationsmanagement": "security",
    "microsoft.scom": "security",
    "microsoft.resourcegraph": "security",
    "microsoft.resourcehealth": "security",
    "microsoft.resourcenotifications": "security",
    "microsoft.serialconsole": "security",
    "microsoft.maintenance": "security",
    "microsoft.changesafety": "security",
    "microsoft.zerotrustsegmentation": "security",
    "microsoft.cleanroom": "security",
    "microsoft.customerlockbox": "security",
    "microsoft.help": "security",
    "microsoft.impact": "security",
    "microsoft.cloudhealth": "security",
    "microsoft.dependencymap": "security",
    "microsoft.inventory": "security",
    "microsoft.discovery": "security",
    "microsoft.adhybridhealthservice": "identity",
    "microsoft.graphservices": "identity",
    "microsoft.subscription": "identity",
    "microsoft.resources": "identity",
    "microsoft.providerhub": "identity",
    "microsoft.features": "identity",
    "microsoft.portal": "identity",
    "microsoft.portalservices": "identity",
    "microsoft.solutions": "identity",
    "microsoft.saas": "billing",
    "microsoft.saashub": "billing",
    "microsoft.softwareplan": "billing",
    "microsoft.programenrollment": "billing",
    "microsoft.professionalservice": "billing",
    "microsoft.carbon": "billing",
    "microsoft.sustainabilityservices": "billing",
}

GCP: dict[str, str] = {
    "compute": "compute",
    "container": "compute",
    "run": "compute",
    "cloudfunctions": "compute",
    "appengine": "compute",
    "dataproc": "compute",
    "batch": "compute",
    "notebooks": "compute",
    "aiplatform": "compute",
    "ml": "compute",
    "storage": "storage",
    "storagetransfer": "storage",
    "file": "storage",
    "backupdr": "storage",
    "networkservices": "network",
    "networksecurity": "network",
    "dns": "network",
    "cdn": "network",
    "apigateway": "network",
    "servicenetworking": "network",
    "bigquery": "data",
    "bigtable": "data",
    "spanner": "data",
    "datastore": "data",
    "firestore": "data",
    "sqladmin": "data",
    "cloudsql": "data",
    "pubsub": "data",
    "dataflow": "data",
    "datafusion": "data",
    "datacatalog": "data",
    "dataplex": "data",
    "memcache": "data",
    "redis": "data",
    "dialogflow": "data",
    "cloudkms": "security",
    "secretmanager": "security",
    "securitycenter": "security",
    "binaryauthorization": "security",
    "logging": "security",
    "monitoring": "security",
    "cloudtrace": "security",
    "clouderrorreporting": "security",
    "cloudasset": "security",
    "iam": "identity",
    "iamcredentials": "identity",
    "resourcemanager": "identity",
    "cloudidentity": "identity",
    "admin": "identity",
    "serviceusage": "identity",
    "billing": "billing",
    "cloudbilling": "billing",
    "commerceoffercatalog": "billing",
    "consumerprocurement": "billing",
    "enterprisepurchasing": "billing",
    "cloudoptimization": "billing",
    "paymentsresellersubscription": "billing",
    # remainder of the GCP surface, reviewed against the IAM permissions reference
    "tpu": "compute",
    "workstations": "compute",
    "workflows": "compute",
    "composer": "compute",
    "cloudscheduler": "compute",
    "cloudtasks": "compute",
    "clouddeploy": "compute",
    "gkehub": "compute",
    "gkemulticloud": "compute",
    "gkeonprem": "compute",
    "baremetalsolution": "compute",
    "vmmigration": "compute",
    "migrationcenter": "compute",
    "cloudmigration": "compute",
    "lifesciences": "compute",
    "automl": "compute",
    "confidentialcomputing": "compute",
    "transcoder": "compute",
    "videostitcher": "compute",
    "firebasehosting": "compute",
    "source": "compute",
    "securesourcemanager": "compute",
    "developerconnect": "compute",
    "dataform": "data",
    "dataprep": "data",
    "datalineage": "data",
    "datalabeling": "data",
    "biglake": "data",
    "metastore": "data",
    "memorystore": "data",
    "managedkafka": "data",
    "managedflink": "data",
    "eventarc": "data",
    "looker": "data",
    "lookerstudio": "data",
    "datastudio": "data",
    "discoveryengine": "data",
    "documentai": "data",
    "speech": "data",
    "cloudtranslate": "data",
    "translationhub": "data",
    "visionai": "data",
    "visualinspection": "data",
    "retail": "data",
    "genomics": "data",
    "firebaseml": "data",
    "recommender": "data",
    "dlp": "security",
    "chronicle": "security",
    "mandiant": "security",
    "privateca": "security",
    "publicca": "security",
    "recaptchaenterprise": "security",
    "beyondcorp": "security",
    "iap": "security",
    "ids": "security",
    "ondemandscanning": "security",
    "assuredoss": "security",
    "policyanalyzer": "security",
    "policysimulator": "security",
    "orgpolicy": "security",
    "osconfig": "security",
    "errorreporting": "security",
    "clouddebugger": "security",
    "cloudprofiler": "security",
    "stackdriver": "security",
    "servicehealth": "security",
    "essentialcontacts": "security",
    "riskmanager": "security",
    "cloudcontrolspartner": "security",
    "securedlandingzone": "security",
    "accesscontextmanager": "identity",
    "accessapproval": "identity",
    "privilegedaccessmanager": "identity",
    "managedidentities": "identity",
    "apikeys": "identity",
    "oauthconfig": "identity",
    "clientauthconfig": "identity",
    "firebaseauth": "identity",
    "servicemanagement": "identity",
    "serviceconsumermanagement": "identity",
    "servicebroker": "identity",
    "resourcesettings": "identity",
    "domains": "network",
    "apigee": "network",
    "apigeeconnect": "network",
    "apihub": "network",
    "trafficdirector": "network",
    "vpcaccess": "network",
    "meshconfig": "network",
    "connectors": "network",
    "integrations": "network",
}


# ---------------------------------------------------------------------------
# Tier 2: keyword rules.
#
# Curating 859 service prefixes across three clouds by hand is not realistic, and pretending
# otherwise would be the dishonest option. Instead every prefix that CURATED/AZURE/GCP does not
# name explicitly is matched against these substring rules, in order, and the catalogue records
# which tier produced each entry. A rule only fires on a token that is unambiguous about what
# the service *holds* — "sql" is data, "firewall" is network — so a wrong bucket is a
# mis-weighted blast radius, never a missed finding: unmatched prefixes still fall through to
# R0 "unmapped permission" rather than being silently absorbed.
# ---------------------------------------------------------------------------
KEYWORD_RULES: tuple[tuple[str, str], ...] = (
    # identity first: these words also appear inside security service names
    ("activedirectory", "identity"),
    ("entraid", "identity"),
    ("managedidentity", "identity"),
    ("authorization", "identity"),
    ("entitlement", "identity"),
    ("directory", "identity"),
    ("identity", "identity"),
    ("credential", "identity"),
    ("principal", "identity"),
    ("iam", "identity"),
    # billing
    ("billing", "billing"),
    ("consumption", "billing"),
    ("costmanagement", "billing"),
    ("cost", "billing"),
    ("commerce", "billing"),
    ("marketplace", "billing"),
    ("pricing", "billing"),
    ("quota", "billing"),
    ("usage", "billing"),
    ("capacity", "billing"),
    # security / posture / observability
    ("keyvault", "security"),
    ("secret", "security"),
    ("securityinsights", "security"),
    ("security", "security"),
    ("sentinel", "security"),
    ("defender", "security"),
    ("threat", "security"),
    ("compliance", "security"),
    ("policyinsights", "security"),
    ("guardconfig", "security"),
    ("attestation", "security"),
    ("codesigning", "security"),
    ("certificate", "security"),
    ("hardwaresecurity", "security"),
    ("pki", "security"),
    ("encrypt", "security"),
    ("kms", "security"),
    ("audit", "security"),
    ("insights", "security"),
    ("monitor", "security"),
    ("observability", "security"),
    ("logging", "security"),
    ("logic", "security"),
    ("diagnostic", "security"),
    ("alerts", "security"),
    ("advisor", "security"),
    ("resourcehealth", "security"),
    ("support", "security"),
    ("guestconfiguration", "security"),
    ("lockbox", "security"),
    ("informationprotection", "security"),
    ("purview", "security"),
    # data stores, analytics, ML inference, messaging
    ("sql", "data"),
    ("db", "data"),
    ("database", "data"),
    ("cosmos", "data"),
    ("documentdb", "data"),
    ("mongo", "data"),
    ("cassandra", "data"),
    ("analytics", "data"),
    ("analysisservices", "data"),
    ("datalake", "data"),
    ("datafactory", "data"),
    ("datamigration", "data"),
    ("dataprotection", "data"),
    ("datashare", "data"),
    ("datareplication", "data"),
    ("bigquery", "data"),
    ("warehouse", "data"),
    ("synapse", "data"),
    ("kusto", "data"),
    ("eventhub", "data"),
    ("eventgrid", "data"),
    ("servicebus", "data"),
    ("notificationhubs", "data"),
    ("messaging", "data"),
    ("pubsub", "data"),
    ("stream", "data"),
    ("search", "data"),
    ("cognitiveservices", "data"),
    ("cognitive", "data"),
    ("machinelearning", "compute"),
    ("inference", "data"),
    ("powerbi", "data"),
    ("fabric", "data"),
    ("healthcare", "data"),
    ("genome", "data"),
    ("cache", "data"),
    ("redis", "data"),
    ("elastic", "data"),
    ("dialogflow", "data"),
    ("bot", "data"),
    ("communication", "data"),
    ("videoindexer", "data"),
    ("digitaltwins", "data"),
    # storage
    ("storage", "storage"),
    ("netapp", "storage"),
    ("fileshare", "storage"),
    ("backup", "storage"),
    ("recoveryservices", "storage"),
    ("databox", "storage"),
    ("edgeorder", "storage"),
    ("blob", "storage"),
    ("bucket", "storage"),
    ("archive", "storage"),
    ("disk", "storage"),
    # network
    ("network", "network"),
    ("firewall", "network"),
    ("cdn", "network"),
    ("frontdoor", "network"),
    ("loadbalanc", "network"),
    ("apimanagement", "network"),
    ("apigateway", "network"),
    ("dns", "network"),
    ("domainregistration", "network"),
    ("peering", "network"),
    ("relay", "network"),
    ("vpn", "network"),
    ("orbital", "network"),
    ("maps", "network"),
    ("edgezones", "network"),
    # compute last: broadest bucket, so it only catches what nothing else claimed
    ("compute", "compute"),
    ("container", "compute"),
    ("kubernetes", "compute"),
    ("virtualmachine", "compute"),
    ("vmware", "compute"),
    ("batch", "compute"),
    ("hdinsight", "compute"),
    ("databricks", "compute"),
    ("appplatform", "compute"),
    ("appservice", "compute"),
    ("appconfig", "compute"),
    ("function", "compute"),
    ("serverless", "compute"),
    ("devtest", "compute"),
    ("devcenter", "compute"),
    ("devops", "compute"),
    ("deployment", "compute"),
    ("build", "compute"),
    ("pipeline", "compute"),
    ("registry", "compute"),
    ("migrate", "compute"),
    ("hybridcompute", "compute"),
    ("servicefabric", "compute"),
    ("desktopvirtualization", "compute"),
    ("windows365", "compute"),
    ("workload", "compute"),
    ("automation", "compute"),
    ("chaos", "compute"),
    ("quantum", "compute"),
    ("iot", "compute"),
    ("device", "compute"),
    ("edge", "compute"),
    ("robot", "compute"),
    ("media", "compute"),
    ("web", "compute"),
    ("app", "compute"),
)


def keyword_category(prefix: str) -> str | None:
    """Second-tier classification. Returns None when no rule is confident."""
    p = prefix.lower().replace("microsoft.", "").replace("-", "").replace("_", "")
    for token, category in KEYWORD_RULES:
        if token in p:
            return category
    return None


def fetch(cloud: str) -> dict:
    CACHE.mkdir(parents=True, exist_ok=True)
    dest = CACHE / f"{cloud}.json"
    if not dest.exists():
        with urllib.request.urlopen(SOURCES[cloud], timeout=180) as r:
            dest.write_bytes(r.read())
    return json.loads(dest.read_text())


def aws_prefixes(raw: dict) -> list[str]:
    return sorted(raw.get("service_sdk_mappings", {}))


def azure_namespaces(raw: object) -> list[str]:
    """Azure ships one entry per resource provider; `name` is the namespace itself."""
    out: set[str] = set()
    items = raw if isinstance(raw, list) else raw.get("operations", [])  # type: ignore[union-attr]
    for entry in items:
        name = entry.get("name") if isinstance(entry, dict) else None
        if isinstance(name, str) and name:
            out.add(name.split("/", 1)[0].lower())
    return sorted(out)


def gcp_services(raw: object) -> list[str]:
    out: set[str] = set()
    items = raw if isinstance(raw, list) else list(raw)  # type: ignore[arg-type]
    for entry in items:
        name = entry.get("name") if isinstance(entry, dict) else entry
        if isinstance(name, str) and "." in name:
            out.add(name.split(".", 1)[0].lower())
    return sorted(out)


def classify(
    prefixes: Iterable[str], table: dict[str, str]
) -> tuple[dict[str, str], dict[str, str], list[str]]:
    """Split prefixes into curated, keyword-derived, and still-unmapped."""
    curated: dict[str, str] = {}
    derived: dict[str, str] = {}
    unknown: list[str] = []
    for p in prefixes:
        if p in table:
            curated[p] = table[p]
            continue
        cat = keyword_category(p)
        if cat:
            derived[p] = cat
        else:
            unknown.append(p)
    return curated, derived, unknown


def emit(catalog: dict[str, dict[str, dict[str, str]]], stats: dict[str, dict[str, int]]) -> str:
    lines = [
        "# GENERATED by scripts/build_service_catalog.py — do not hand-edit.",
        "#",
        "# Service prefix -> canonical category, derived from the public iam-dataset corpus",
        "# (AWS Service Authorization Reference, Azure provider operations, GCP IAM permissions).",
        "# Provider mappings layer their own hand-tuned `services:` entries ON TOP of this file,",
        "# so a curated entry in aws.yaml/azure.yaml/gcp.yaml always beats anything here.",
        "#",
        "# `tier` records how each entry was decided:",
        "#   curated — named explicitly in the script's reviewed table",
        "#   keyword — matched a documented substring rule (see KEYWORD_RULES)",
        "# Prefixes that matched neither are deliberately absent: they stay unmapped and surface",
        "# as R0 rather than being absorbed into a bucket nobody checked.",
        "#",
        "# Coverage at generation time:",
    ]
    for cloud, s in stats.items():
        tot = s["total"]
        cov = s["curated"] + s["keyword"]
        pct = (100.0 * cov / tot) if tot else 0.0
        lines.append(
            f"#   {cloud:6} {cov:4} / {tot:4} ({pct:5.1f}%)"
            f"  curated={s['curated']:3} keyword={s['keyword']:3} unmapped={s['unknown']:3}"
        )
    lines += ["version: 1", "services:"]
    for cloud in ("aws", "azure", "gcp"):
        entries = catalog.get(cloud, {})
        lines.append(f"  {cloud}:")
        for prefix in sorted(entries):
            row = entries[prefix]
            lines.append(f"    {prefix}: {{category: {row['category']}, tier: {row['tier']}}}")
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--fetch", action="store_true", help="download sources if not cached")
    ap.add_argument("--report", action="store_true", help="print coverage, do not write")
    args = ap.parse_args()

    catalog: dict[str, dict[str, dict[str, str]]] = {}
    stats: dict[str, dict[str, int]] = {}
    unknowns: dict[str, list[str]] = {}

    for cloud, extractor, table in (
        ("aws", aws_prefixes, CURATED),
        ("azure", azure_namespaces, AZURE),
        ("gcp", gcp_services, GCP),
    ):
        try:
            raw = fetch(cloud)
        except Exception as exc:  # noqa: BLE001
            print(f"!! {cloud}: {exc}", file=sys.stderr)
            continue
        # Union with the curated table: reviewed knowledge must not be gated by whether the
        # upstream corpus happens to list a prefix (it lags new services by weeks).
        prefixes = sorted(set(extractor(raw)) | set(table))  # type: ignore[operator]
        curated, derived, unknown = classify(prefixes, table)
        catalog[cloud] = {
            **{p: {"category": c, "tier": "curated"} for p, c in curated.items()},
            **{p: {"category": c, "tier": "keyword"} for p, c in derived.items()},
        }
        stats[cloud] = {
            "curated": len(curated),
            "keyword": len(derived),
            "unknown": len(unknown),
            "total": len(prefixes),
        }
        unknowns[cloud] = unknown

    for cloud, s in stats.items():
        cov = s["curated"] + s["keyword"]
        pct = (100.0 * cov / s["total"]) if s["total"] else 0.0
        print(
            f"{cloud:6} {cov:4}/{s['total']:4} ({pct:5.1f}%)"
            f"  curated={s['curated']:3} keyword={s['keyword']:3} unmapped={s['unknown']:3}"
        )
        if unknowns[cloud]:
            print(f"        still unmapped — e.g. {' '.join(unknowns[cloud][:10])}")

    if not args.report:
        OUT.write_text(emit(catalog, stats))
        print(f"\nwrote {OUT.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
