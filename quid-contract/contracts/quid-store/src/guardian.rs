//! Guardian / emergency controls (extension point).
//!
//! Not implemented yet. `quid-store`'s admin (set once by `initialize`) only
//! configures linked contracts; mission owners pause their own missions with
//! `pause_mission`. A guardian role (global pause, freeze a mission) goes here.
//! It must be set once at deploy time, never first-caller-wins.
