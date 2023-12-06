import {defs, tiny} from './examples/common.js';
import {Axes_Viewer, Axes_Viewer_Test_Scene} from "./examples/axes-viewer.js"
import {Collision_Demo, Inertia_Demo} from "./examples/collisions-demo.js"
import {Many_Lights_Demo} from "./examples/many-lights-demo.js"
import {Balloons} from "./balloons.js"
import {Scene_To_Texture_Demo} from "./examples/scene-to-texture-demo.js"
import {Surfaces_Demo} from "./examples/surfaces-demo.js"
import {Text_Demo} from "./examples/text-demo.js"
import {Transforms_Sandbox} from "./examples/transforms-sandbox.js"
import {FinalProject} from "./final-project.js";
//import {RenderObjsMtls} from "./render-objs-mtls.js";
import {Prizes} from "./prizes.js";
// Pull these names into this module's scope for convenience:
const {
    Vector, Vector3, vec, vec3, vec4, color, Matrix, Mat4, Light, Shape, Material, Shader, Texture, Scene,
    Canvas_Widget, Code_Widget, Text_Widget
} = tiny;

// Now we have loaded everything in the files tiny-graphics.js, tiny-graphics-widgets.js, and common.js.
// This yielded "tiny", an object wrapping the stuff in the first two files, and "defs" for wrapping all the rest.

// ******************** Extra step only for when executing on a local machine:
//                      Load any more files in your directory and copy them into "defs."
//                      (On the web, a server should instead just pack all these as well
//                      as common.js into one file for you, such as "dependencies.js")

const Minimal_Webgl_Demo = defs.Minimal_Webgl_Demo;
const Movement_Controls = defs.Movement_Controls; 
Object.assign(defs,
    {Axes_Viewer, Axes_Viewer_Test_Scene},
    {Inertia_Demo, Collision_Demo},
    {Many_Lights_Demo},
    {Balloons},
    {Scene_To_Texture_Demo},
    {Surfaces_Demo},
    {Text_Demo},
    {Transforms_Sandbox},
    {FinalProject},
    {Prizes},
);

// ******************** End extra step

// (Can define Main_Scene's class here)
var Main_Scene = FinalProject;

const Additional_Scenes = []; //Add Movement_Controls to the brackets if you want to easily move the camera around the screen during testing/development


export {Main_Scene, Additional_Scenes, Canvas_Widget, Code_Widget, Text_Widget, defs}