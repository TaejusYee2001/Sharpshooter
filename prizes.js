import {defs, tiny} from './examples/common.js';
// Pull these names into this module's scope for convenience:
import {Text_Line} from "./examples/text-demo.js";

const {vec3, vec4, vec, color, hex_color, Mat4, Light, Shape, Material, Shader, Texture, Scene} = tiny;

export class Shape_From_File extends Shape {                                   // **Shape_From_File** is a versatile standalone Shape that imports
                                                                               // all its arrays' data from an .obj 3D model file.
    constructor(filename) {
        super("position", "normal", "texture_coord");
        // Begin downloading the mesh. Once that completes, return
        // control to our parse_into_mesh function.
        this.load_file(filename);
    }

    load_file(filename) {                             // Request the external file and wait for it to load.
        // Failure mode:  Loads an empty shape.
        return fetch(filename)
            .then(response => {
                if (response.ok) return Promise.resolve(response.text())
                else return Promise.reject(response.status)
            })
            .then(obj_file_contents => this.parse_into_mesh(obj_file_contents))
            .catch(error => {
                this.copy_onto_graphics_card(this.gl);
            })
    }

    parse_into_mesh(data) {                           // Adapted from the "webgl-obj-loader.js" library found online:
        var verts = [], vertNormals = [], textures = [], unpacked = {};

        unpacked.verts = [];
        unpacked.norms = [];
        unpacked.textures = [];
        unpacked.hashindices = {};
        unpacked.indices = [];
        unpacked.index = 0;

        var lines = data.split('\n');

        var VERTEX_RE = /^v\s/;
        var NORMAL_RE = /^vn\s/;
        var TEXTURE_RE = /^vt\s/;
        var FACE_RE = /^f\s/;
        var WHITESPACE_RE = /\s+/;

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            var elements = line.split(WHITESPACE_RE);
            elements.shift();

            if (VERTEX_RE.test(line)) verts.push.apply(verts, elements);
            else if (NORMAL_RE.test(line)) vertNormals.push.apply(vertNormals, elements);
            else if (TEXTURE_RE.test(line)) textures.push.apply(textures, elements);
            else if (FACE_RE.test(line)) {
                var quad = false;
                for (var j = 0, eleLen = elements.length; j < eleLen; j++) {
                    if (j === 3 && !quad) {
                        j = 2;
                        quad = true;
                    }
                    if (elements[j] in unpacked.hashindices)
                        unpacked.indices.push(unpacked.hashindices[elements[j]]);
                    else {
                        var vertex = elements[j].split('/');

                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                        unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);

                        if (textures.length) {
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 0]);
                            unpacked.textures.push(+textures[((vertex[1] - 1) || vertex[0]) * 2 + 1]);
                        }

                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 0]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 1]);
                        unpacked.norms.push(+vertNormals[((vertex[2] - 1) || vertex[0]) * 3 + 2]);

                        unpacked.hashindices[elements[j]] = unpacked.index;
                        unpacked.indices.push(unpacked.index);
                        unpacked.index += 1;
                    }
                    if (j === 3 && quad) unpacked.indices.push(unpacked.hashindices[elements[0]]);
                }
            }
        }
        {
            const {verts, norms, textures} = unpacked;
            for (var j = 0; j < verts.length / 3; j++) {
                this.arrays.position.push(vec3(verts[3 * j], verts[3 * j + 1], verts[3 * j + 2]));
                this.arrays.normal.push(vec3(norms[3 * j], norms[3 * j + 1], norms[3 * j + 2]));
                this.arrays.texture_coord.push(vec(textures[2 * j], textures[2 * j + 1]));
            }
            this.indices = unpacked.indices;
        }
        this.normalize_positions(false);
        this.ready = true;
    }

    draw(context, program_state, model_transform, material) {               // draw(): Same as always for shapes, but cancel all
        // attempts to draw the shape before it loads:
        if (this.ready)
            super.draw(context, program_state, model_transform, material);
    }
}

export class Prizes extends Scene {                           // **Balloons** show how to load a single 3D model from an OBJ file.
    // Detailed model files can be used in place of simpler primitive-based
    // shapes to add complexity to a scene.  Simpler primitives in your scene
    // can just be thought of as placeholders until you find a model file
    // that fits well.  This demo shows the teapot model twice, with one
    // teapot showing off the Fake_Bump_Map effect while the other has a
    // regular texture and Phong lighting.
    constructor() {
        super();
        // Load the model file:
        //this.shapes = {"teapot": new Shape_From_File("assets/teapot.obj")};
        this.shapes = {"coin": new defs.Capped_Cylinder(200, 50, [0, 1]),
                        "shelf": new defs.Cube(),
                        "comp_cube": new defs.Cube(),
                        //"rabbit": new Shape_From_File("assets/rabbit.obj"),
                        "globe": new defs.Subdivision_Sphere(4),
                        "ice_cream": new defs.Closed_Cone(100, 100, [0.0, 1.0]),
                        "cream": new defs.Subdivision_Sphere(4),
                        "button": new defs.Square(),
                        "text": new Text_Line(35),
        };

        // Don't create any DOM elements to control this scene:
        this.widget_options = {make_controls: false};
        // Non bump mapped:
        this.materials = {
            shelf:  new Material(new defs.Phong_Shader(1), {
                color: hex_color("#8B0000"),
                ambient: .2, diffusivity: 1, specularity: .8}),
            coin: new Material(new defs.Textured_Phong(1), {
                color: hex_color("#8B8000"),
                ambient: .2, diffusivity: .8, texture: new Texture("assets/money.png")}),
            comp_cube: new Material(new defs.Textured_Phong(1), {
                color: hex_color("#000000"),
                ambient: .4, diffusivity: .8, specularity: 1, texture: new Texture("assets/companion-cube.png")}),
            rabbit: new Material(new defs.Phong_Shader(1), {
                color: hex_color("#FFB6C1"),
                ambient: .2, diffusivity: 1, specularity: .8}),
            globe: new Material(new defs.Textured_Phong(1), {
                color: hex_color("#000000"),
                ambient: .4, diffusivity: .8, specularity: 1, texture: new Texture("assets/earth.gif")}),
            ice_cream: new Material(new defs.Textured_Phong(1), {
                color: hex_color("#5B3C1E"),
                ambient: .4, diffusivity: 1, specularity: .2, texture: new Texture("assets/fixed_waffle.png")}),
            cream: new Material(new defs.Textured_Phong(1), {
                color: hex_color("#FFFDD0"),
                ambient: .2, diffusivity: 1, specularity: .2, texture: new Texture("assets/ice.png")}),
            button: new Material(new defs.Phong_Shader(1), {
                color: hex_color("#051650"),
                ambient: .2, diffusivity: 1, specularity: .8}),
        }

        this.text_image = new Material(new defs.Textured_Phong(1), {
            ambient: 1, diffusivity: 0, specularity: 0,
            texture: new Texture("assets/text.png")
        });

    }

    display(context, program_state) {
        //const t = program_state.animation_time;

        program_state.set_camera(Mat4.translation(0, 0, -5));    // Locate the camera here (inverted matrix).
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 500);
        // A spinning light to show off the bump map:
        /*program_state.lights = [new Light(
            Mat4.rotation(t / 300, 1, 0, 0).times(vec4(3, 2, 10, 1)),
            color(1, .7, .7, 1), 100000)];*/

        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        const t = program_state.animation_time / 1000

        //for (let i of [-1, 1]) {                                       // Spin the 3D model shapes as well.
        const model_transform_coin = Mat4.identity().times(Mat4.translation(1.8, -.2, 0))
                                                .times(Mat4.rotation(- Math.PI / 4, 0, 1, 0))
                                                .times(Mat4.rotation(Math.PI/20, 0, 0, 1))
                                                .times(Mat4.rotation(2 * Math.PI * t /3, 0, 1, 0))
                                                //.times(Mat4.rotation(Math.PI / 8, 0, 0, 1))
                                                .times(Mat4.scale(1, 1, .3))
                                                .times(Mat4.scale(.3, .3, .3));//.times;



        const model_transform_shelf_1 = Mat4.identity().times(Mat4.translation(0, .5, 0)).times(Mat4.scale(2.5, .07, 1));
        const model_transform_shelf_2 = model_transform_shelf_1.times(Mat4.translation(0, -17, 0));

        const model_transform_globe = Mat4.identity().times(Mat4.translation(-1.7, 0, 0))
                                                        .times(Mat4.rotation(Math.PI/20, 0, 0, 1))
                                                        .times(Mat4.rotation(2 * Math.PI * t /3, 0, 1, 0))
                                                        .times(Mat4.scale(.5, .5, .5));


        const model_transform_compCube = Mat4.identity().times(Mat4.translation(.6, -.15, .5))
                                                        .times(Mat4.rotation(Math.PI/20, 0, 0, 1))
                                                        .times(Mat4.rotation(2 * Math.PI * t /3, 0, 1, 0))
                                                        .times(Mat4.scale(.3, .3, .3));

        const model_transform_iceCream = Mat4.identity().times(Mat4.translation(-.5, -.35, 0))
            .times(Mat4.rotation(Math.PI/20, 0, 0, 1))
            .times(Mat4.rotation(2 * Math.PI * t /3, 0, 1, 0))
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.scale(.25, .25, .25));
                        ;

        const model_transform_cream = Mat4.identity().times(Mat4.translation(-.56, .04, 0))
                                                        .times(Mat4.rotation(Math.PI/20, 0, 0, 1))
                                                        .times(Mat4.rotation(2 * Math.PI * t /3, 0, 1, 0))
                                                        .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
                                                        .times(Mat4.scale(.27, .27, .27));

        const model_transform_cream2 =
        Mat4.identity()
            .times(Mat4.translation(.77, .2, 0))
            .times(Mat4.translation(-1.36, .04, 0))
            .times(Mat4.rotation(Math.PI/20, 0, 0, 1))
            .times(Mat4.rotation(2 * Math.PI * t /3, 0, 1, 0))
            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
            .times(Mat4.scale(.8, .8, .8))
            .times(Mat4.scale(.27, .27, .27));
        /*const model_transform_rabbit = Mat4.identity().times(Mat4.translation(0, -.6, 0))
                                                        .times(Mat4.scale(.5, .5, .5));*/
        //this.shapes.rabbit.draw(context, program_state, model_transform_rabbit, this.materials.rabbit);

        const button1 = Mat4.identity()
            .times(Mat4.translation(-1.7, -1, .9))
            .times(Mat4.scale(.4, .2, 1))
        ;

        const button2 = Mat4.identity()
            .times(Mat4.translation(-.6, -1, .9))
            .times(Mat4.scale(.4, .2, 1))
        ;
        const button3 = Mat4.identity()
            .times(Mat4.translation(.6, -1, .9))
            .times(Mat4.scale(.4, .2, 1))
        ;
        const button4 = Mat4.identity()
            .times(Mat4.translation(1.8, -1, .9))
            .times(Mat4.scale(.4, .2, 1))
        ;




        const text1_transform = Mat4.identity().times(Mat4.translation(-1.9, 1, .5))
            .times(Mat4.scale(.17, .17, .17));

        const button1_price = Mat4.identity().times(Mat4.translation(-1.9, -1.08, .99))
            .times(Mat4.scale(.05, .05, .05));
        const button1_title = Mat4.identity().times(Mat4.translation(-1.97, -.9, .99))
            .times(Mat4.scale(.06, .06, .06));

        const button2_price = Mat4.identity().times(Mat4.translation(-.81, -1.08, .99))
            .times(Mat4.scale(.05, .05, .05));
        const button2_title = Mat4.identity().times(Mat4.translation(-.92, -.9, .99))
            .times(Mat4.scale(.055, .05, .05));

        const button3_price = Mat4.identity().times(Mat4.translation(.35, -1.08, .99))
            .times(Mat4.scale(.05, .05, .05));
        const button3_title = Mat4.identity().times(Mat4.translation(.26, -.9, .99))
            .times(Mat4.scale(.055, .05, .05));

        const button4_price = Mat4.identity().times(Mat4.translation(1.57, -1.08, .99))
            .times(Mat4.scale(.05, .05, .05));
        const button4_title = Mat4.identity().times(Mat4.translation(1.43, -.9, .99))
            .times(Mat4.scale(.055, .05, .05));


        this.shapes.text.set_string("PRIZES AVAILABLE:", context.context);
        this.shapes.text.draw(context, program_state, text1_transform, this.text_image);



        this.shapes.coin.draw(context, program_state, model_transform_coin, this.materials.coin);

        //this.shapes.shelf.draw(context, program_state, model_transform_shelf_1, this.materials.shelf);
        this.shapes.shelf.draw(context, program_state, model_transform_shelf_2, this.materials.shelf);

        this.shapes.comp_cube.draw(context, program_state, model_transform_compCube, this.materials.comp_cube);
        this.shapes.comp_cube.draw(context, program_state, model_transform_compCube, this.materials.comp_cube);

        this.shapes.globe.draw(context, program_state, model_transform_globe, this.materials.globe);
        this.shapes.ice_cream.draw(context, program_state, model_transform_iceCream, this.materials.ice_cream)
        this.shapes.cream.draw(context, program_state, model_transform_cream, this.materials.cream)
        this.shapes.cream.draw(context, program_state, model_transform_cream2, this.materials.cream)

        this.shapes.button.draw(context, program_state, button1, this.materials.button)
        this.shapes.text.set_string("260 PTS", context.context);
        this.shapes.text.draw(context, program_state, button1_price, this.text_image);
        this.shapes.text.set_string("A4 Globe", context.context);
        this.shapes.text.draw(context, program_state, button1_title, this.text_image);


        this.shapes.button.draw(context, program_state, button2, this.materials.button)
        this.shapes.text.set_string("200 PTS", context.context);
        this.shapes.text.draw(context, program_state, button2_price, this.text_image);
        this.shapes.text.set_string("Ice Cream", context.context);
        this.shapes.text.draw(context, program_state, button2_title, this.text_image);

        this.shapes.button.draw(context, program_state, button3, this.materials.button)
        this.shapes.text.set_string("160 PTS", context.context);
        this.shapes.text.draw(context, program_state, button3_price, this.text_image);
        this.shapes.text.set_string("Cool Cube", context.context);
        this.shapes.text.draw(context, program_state, button3_title, this.text_image);

        this.shapes.button.draw(context, program_state, button4, this.materials.button)
        this.shapes.text.set_string("60 PTS", context.context);
        this.shapes.text.draw(context, program_state, button4_price, this.text_image);
        this.shapes.text.set_string("Gold Coin", context.context);
        this.shapes.text.draw(context, program_state, button4_title, this.text_image);


    }
    /*
        show_explanation(document_element) {
            document_element.innerHTML += "<p>This demo loads an external 3D model file of a teapot.  It uses a condensed version of the \"webgl-obj-loader.js\" "
                + "open source library, though this version is not guaranteed to be complete and may not handle some .OBJ files.  It is contained in the class \"Shape_From_File\". "
                + "</p><p>One of these teapots is lit with bump mapping.  Can you tell which one?</p>";
        }*/
}




//sphere: new defs.Subdivision_Sphere(4),