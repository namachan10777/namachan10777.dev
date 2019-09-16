port module Storage exposing (..)

import Fs
import Json.Decode as Decode
import Os


type alias Hist =
    ( String, String, Os.CmdResult )


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
