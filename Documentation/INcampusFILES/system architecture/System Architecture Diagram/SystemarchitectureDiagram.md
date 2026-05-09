# System Architecture Diagram v1.1

## Version Log

| Version | Date | Change | Notes | Source |
| --- | --- | --- | --- | --- |
| 1.1 | 2026-05-08 | Final pre-skeleton alignment | Updated the architecture diagram source and rendered output to preserve the ten-store model, show Admin Insights as consent-gated read-only access through existing stores, keep Campus Admin identity as runtime context, identify NSF as the only `DS-NS-001` writer, and exclude pending-request withdrawal notifications. | Final documentation review + team decisions 2026-05-08 |

Starting from [01 Design Scope and Architectural Choice](https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/aDLBrC6uUkNuWav_YBetC) add the following and design the System Architecture Diagram:

# Task - System Architecture Diagram

Create the v1.1 first-skeleton System Architecture Diagram for InCampus.

## Source Document

Use only:

[01 Design Scope and Architectural Choice](https://app.affine.pro/workspace/d111b336-4261-4720-a05c-80fffe2c0b23/aDLBrC6uUkNuWav_YBetC)

![](assets/system-architecture-diagram-v1.1.svg)

The diagram shows InCampus as one central multi-tenant modular monolith for the first code architecture skeleton. The Student Mobile App and Campus Admin Interface access a single Central InCampus Backend Application, which is internally organized into the required backend modules and uses an Internal Event Dispatcher for accepted first-skeleton internal events. Campus-specific records and administrative operations are kept inside one Shared Database Layer and are scoped or validated by `CampusID`, which acts as the explicit tenant boundary.

The shared database layer contains exactly the ten canonical stores and does not include `DS-CA-003`, a Campus Admin Store, or an Admin Account Store. Campus Admin identity is represented as `AuthenticatedAdminContext` from the admin portal/auth layer. Admin Insights are included as an MVP capability through the Campus Administration module with read-only, campus-scoped, consent-gated access to `DS-AP-001`, `DS-AP-002`, `DS-HL-001`, and `DS-HL-002`. Logical store ownership is preserved even though the first skeleton uses shared persistence.

`DS-NS-001 Notification Records` is written only by Notifications and System Flow. Pending request withdrawal has no user-facing notification branch and no NSF handler in the first skeleton.

```
@startdot
digraph InCampusArchitecture {
  graph [
    bgcolor="white",
    rankdir=LR,
    compound=true,
    newrank=true,
    splines=polyline,
    nodesep=0.38,
    ranksep=0.65,
    pad=0.18,
    fontname="Arial",
    fontsize=20,
    labelloc="t",
    label="InCampus - First-Skeleton System Architecture Diagram v1.1"
  ];

  node [
    fontname="Arial",
    fontsize=12,
    color="#53616F",
    penwidth=1.2
  ];

  edge [
    fontname="Arial",
    fontsize=11,
    color="#3F4A5A",
    penwidth=1.2,
    arrowsize=0.75
  ];

  subgraph cluster_clients {
    label="Client Applications";
    color="#7C8DA0";
    penwidth=1.4;
    style="rounded,filled";
    fillcolor="#EAF3FF";
    margin=14;

    clients [
      shape=plain,
      label=<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="8" CELLPADDING="12" COLOR="#53616F">
          <TR>
            <TD PORT="student" BGCOLOR="#F8FBFF"><B>Student Mobile App</B></TD>
          </TR>
          <TR>
            <TD PORT="admin" BGCOLOR="#F8FBFF"><B>Campus Admin Interface</B></TD>
          </TR>
        </TABLE>
      >
    ];
  }

  subgraph cluster_platform {
    label=<
      <B>Central InCampus Platform</B><BR/>
      <FONT POINT-SIZE="12">Multi-tenant modular monolith - Tenant boundary: <B>CampusID</B></FONT>
    >;
    color="#2563EB";
    penwidth=1.7;
    style="rounded,dashed";
    margin=18;

    subgraph cluster_backend {
      label=<
        <B>Central InCampus Backend Application</B><BR/>
        <FONT POINT-SIZE="11">Modular Monolith</FONT>
      >;
      color="#64748B";
      penwidth=1.4;
      style="rounded,filled";
      fillcolor="#F8FAFC";
      margin=16;

      backend_modules [
        shape=plain,
        label=<
          <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="7" CELLPADDING="11" COLOR="#53616F">
            <TR>
              <TD COLSPAN="2" BGCOLOR="#EEF4FA"><B>Internal Backend Modules</B></TD>
            </TR>
            <TR>
              <TD PORT="ap" BGCOLOR="#FFFFFF">Access and Profile</TD>
              <TD PORT="ca" BGCOLOR="#FFFFFF">Campus Administration</TD>
            </TR>
            <TR>
              <TD PORT="hl" BGCOLOR="#FFFFFF">Hosting and Lifecycle</TD>
              <TD PORT="dp" BGCOLOR="#FFFFFF">Discovery and Participation</TD>
            </TR>
            <TR>
              <TD PORT="sm" BGCOLOR="#FFFFFF">Safety and Moderation</TD>
              <TD PORT="nsf" BGCOLOR="#FFFFFF">Notifications and System Flow</TD>
            </TR>
          </TABLE>
        >
      ];

      event_dispatcher [
        shape=box3d,
        style="filled",
        fillcolor="#F4F1FF",
        color="#6D4AFF",
        label="Internal Event Dispatcher /\nFirst-skeleton internal events\n(no PendingRequestWithdrawn NSF handler)"
      ];

      admin_insights [
        shape=box,
        style="rounded,filled",
        fillcolor="#ECFDF5",
        color="#0F766E",
        label="CA Admin Insight Process\nadmin-only, campus-scoped\nread-only, consent-gated"
      ];
    }

    shared_db [
      shape=plain,
      label=<
        <TABLE BORDER="0" CELLBORDER="1" CELLSPACING="7" CELLPADDING="10" COLOR="#0F766E">
          <TR>
            <TD COLSPAN="2" BGCOLOR="#DFF8EF">
              <B>Shared Database Layer</B><BR/>
              <FONT POINT-SIZE="11">Ten canonical stores - Logical ownership preserved - Campus-specific records scoped by <B>CampusID</B></FONT>
            </TD>
          </TR>
          <TR>
            <TD BGCOLOR="#F4FFFB">Campus Administration records<BR/>DS-CA-001 Campus Configuration<BR/>DS-CA-002 Campus Structured Options</TD>
            <TD BGCOLOR="#F4FFFB">Access and Profile records<BR/>DS-AP-001 Student Account<BR/>DS-AP-002 Student Profile<BR/>DS-AP-003 University Identity Rules</TD>
          </TR>
          <TR>
            <TD BGCOLOR="#F4FFFB">Hosting and Participation records<BR/>DS-HL-001 Activities<BR/>DS-HL-002 Activity Participations</TD>
            <TD BGCOLOR="#F4FFFB">Safety and Moderation records<BR/>DS-SM-001 Block Relationships<BR/>DS-SM-002 Report Records</TD>
          </TR>
          <TR>
            <TD COLSPAN="2" BGCOLOR="#F4FFFB">Notification records<BR/>DS-NS-001 Notification Records<BR/><FONT POINT-SIZE="10">NSF is the only writer; opening notification is read-only</FONT></TD>
          </TR>
          <TR>
            <TD COLSPAN="2" BGCOLOR="#FFF7ED">No DS-CA-003 / Admin Account Store / Campus Admin database</TD>
          </TR>
        </TABLE>
      >
    ];
  }

  delivery [
    shape=box,
    style="rounded,filled",
    fillcolor="#FFF3E8",
    color="#C65A1E",
    label="External Notification\nDelivery Mechanism"
  ];

  // Layout-only constraint; not an architectural dependency.
  event_dispatcher -> delivery [style=invis, weight=6];

  clients:student:e -> backend_modules:w [
    label="campus-scoped requests\n(CampusID)",
    lhead=cluster_backend
  ];
  clients:admin:e -> backend_modules:w [
    label="admin operations\n(AuthenticatedAdminContext)",
    lhead=cluster_backend
  ];

  backend_modules:e -> shared_db:w [
    label="shared persistence access\nwithin owned stores and CampusID scope"
  ];

  backend_modules:ca:e -> admin_insights:w [
    label="DUC-CA-03"
  ];

  admin_insights:e -> shared_db:w [
    label="read-only insight access:\nDS-AP-001 consent + allowed AP/H&L data\nno writes, no new store"
  ];

  backend_modules:e -> event_dispatcher:w [
    label="accepted internal events"
  ];
  event_dispatcher:w -> backend_modules:nsf:e [
    label="notification-producing events only"
  ];

  backend_modules:nsf:e -> delivery:w [
    label="notification delivery requests"
  ];
}
@enddot
```
