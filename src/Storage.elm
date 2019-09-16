port module Storage exposing (..)

import Fs
import Json.Decode as Decode
import Json.Encode as Encode
import Os


port storeStoraged : Encode.Value -> Cmd msg


port requestStoraged : () -> Cmd msg


port loadStoraged : (Encode.Value -> msg) -> Sub msg


type alias Hist =
    ( String, String, Os.CmdResult )


type alias Storaged =
    ( List Hist, Os.System )


outputDecoder : Decode.Decoder Os.Output
outputDecoder =
    Decode.field "type" Decode.string
        |> Decode.andThen
            (\typeName ->
                case typeName of
                    "str" ->
                        Decode.map Os.Str (Decode.field "text" Decode.string)

                    "a" ->
                        Decode.map2 Os.A (Decode.field "text" Decode.string) (Decode.field "link" Decode.string)

                    "img" ->
                        Decode.map3 Os.Img
                            (Decode.field "class" Decode.string)
                            (Decode.field "src" Decode.string)
                            (Decode.maybe
                                (Decode.map2
                                    (\author link -> ( author, link ))
                                    (Decode.field "author" Decode.string)
                                    (Decode.field "link" Decode.string)
                                )
                            )

                    other ->
                        Decode.fail ("unexpected output type: " ++ other)
            )


cmdResultDecoder : Decode.Decoder Os.CmdResult
cmdResultDecoder =
    Decode.field "type" Decode.string
        |> Decode.andThen
            (\typeName ->
                case typeName of
                    "stdout" ->
                        Decode.map Os.Stdout (Decode.field "outputs" (Decode.list outputDecoder))

                    "nocmd" ->
                        Decode.succeed Os.NoCmd

                    "clear" ->
                        Decode.succeed Os.Clear

                    other ->
                        Decode.fail ("unexpected cmd result type: " ++ other)
            )


histDecoder : Decode.Decoder Hist
histDecoder =
    Decode.map3 (\dir cmd result -> ( dir, cmd, result ))
        (Decode.field "dir" Decode.string)
        (Decode.field "cmd" Decode.string)
        (Decode.field "result" cmdResultDecoder)


histsDecoder : Decode.Decoder (List Hist)
histsDecoder =
    Decode.list histDecoder


fsDecoder : Decode.Decoder Fs.Fs
fsDecoder =
    Decode.field "type" Decode.string
        |> Decode.andThen
            (\typeName ->
                case typeName of
                    "file" ->
                        Decode.map2 Fs.File
                            (Decode.field "name" Decode.string)
                            (Decode.field "id" Decode.string)

                    "dir" ->
                        Decode.map2 Fs.Dir
                            (Decode.field "name" Decode.string)
                            (Decode.field "children" (Decode.list fsDecoder))

                    other ->
                        Decode.fail ("unexpected fs type: " ++ other)
            )


systemDecoder : Decode.Decoder Os.System
systemDecoder =
    Decode.map2 Os.System
        (Decode.field "root" fsDecoder)
        (Decode.field "current" (Decode.list Decode.string))


storagedDecoder : Decode.Decoder Storaged
storagedDecoder =
    Decode.map2 (\hists system -> ( hists, system ))
        (Decode.field "hists" histsDecoder)
        (Decode.field "system" systemDecoder)


outputEncode : Os.Output -> Encode.Value
outputEncode output =
    case output of
        Os.Str text ->
            Encode.object
                [ ( "type", Encode.string "str" )
                , ( "text", Encode.string text )
                ]

        Os.A text link ->
            Encode.object
                [ ( "type", Encode.string "a" )
                , ( "text", Encode.string text )
                , ( "link", Encode.string link )
                ]

        Os.Img class src Nothing ->
            Encode.object
                [ ( "type", Encode.string "img" )
                , ( "class", Encode.string class )
                , ( "src", Encode.string src )
                ]

        Os.Img class src (Just ( author, link )) ->
            Encode.object
                [ ( "type", Encode.string "img" )
                , ( "class", Encode.string class )
                , ( "src", Encode.string src )
                , ( "author", Encode.string author )
                , ( "link", Encode.string link )
                ]


cmdResultEncode : Os.CmdResult -> Encode.Value
cmdResultEncode cmdResult =
    case cmdResult of
        Os.Stdout outputs ->
            Encode.object
                [ ( "type", Encode.string "stdout" )
                , ( "outputs", Encode.list outputEncode outputs )
                ]

        Os.NoCmd ->
            Encode.object
                [ ( "type", Encode.string "nocmd" )
                ]

        Os.Clear ->
            Encode.object
                [ ( "type", Encode.string "clear" )
                ]


histEncode : Hist -> Encode.Value
histEncode hist =
    case hist of
        ( dir, cmd, result ) ->
            Encode.object
                [ ( "dir", Encode.string dir )
                , ( "cmd", Encode.string cmd )
                , ( "result", cmdResultEncode result )
                ]


histsEncode : List Hist -> Encode.Value
histsEncode hists =
    Encode.list histEncode hists


fsEncode : Fs.Fs -> Encode.Value
fsEncode fs =
    case fs of
        Fs.Dir name children ->
            Encode.object
                [ ( "type", Encode.string "dir" )
                , ( "name", Encode.string name )
                , ( "children", Encode.list fsEncode children )
                ]

        Fs.File name id ->
            Encode.object
                [ ( "type", Encode.string "file" )
                , ( "name", Encode.string name )
                , ( "id", Encode.string id )
                ]


systemEncode : Os.System -> Encode.Value
systemEncode system =
    Encode.object
        [ ( "current", Encode.list Encode.string system.current )
        , ( "root", fsEncode system.root )
        ]


storagedEncode : Storaged -> Encode.Value
storagedEncode storaged =
    case storaged of
        ( hists, system ) ->
            Encode.object
                [ ( "hists", histsEncode hists )
                , ( "system", systemEncode system )
                ]
