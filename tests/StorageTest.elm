module StorageTest exposing (decoderTests)

import Expect
import Fs
import Json.Decode as Decode
import Os
import Storage exposing (..)
import Test exposing (..)


decoderTests : Test
decoderTests =
    describe "test decoders"
        [ describe "Fs.Fs"
            [ test "decode file" <|
                \_ ->
                    Expect.equal
                        (Decode.decodeString fsDecoder """
                            {
                                "type":"file",
                                "name":"sample.txt",
                                "id":"sample-id"
                            }
                        """)
                        (Ok (Fs.File "sample.txt" "sample-id"))
            , test "decode dir" <|
                \_ ->
                    Expect.equal
                        (Decode.decodeString fsDecoder """
                            {
                                "type":"dir",
                                "name":"root",
                                "children": []
                            }
                        """)
                        (Ok (Fs.Dir "root" []))
            , test "decode dir contains file" <|
                \_ ->
                    Expect.equal
                        (Decode.decodeString fsDecoder """
                            {
                                "type": "dir",
                                "name": "root",
                                "children": [
                                    {
                                        "type": "file",
                                        "name": "sample.txt",
                                        "id": "sample-id"
                                    }
                                ]
                            }
                        """)
                        (Ok (Fs.Dir "root" [ Fs.File "sample.txt" "sample-id" ]))
            ]
        , describe "Hist"
            [ test "Stdout" <|
                \_ ->
                    Expect.equal
                        (Decode.decodeString histDecoder """
                            {
                                "cmd": "cat a b c",
                                "dir": "/",
                                "result": {
                                    "type": "stdout",
                                    "outputs": [
                                        {
                                            "type": "str",
                                            "text": "test"
                                        },
                                        {
                                            "type": "a",
                                            "text": "Google",
                                            "link": "https://google.com"
                                        },
                                        {
                                            "type": "img",
                                            "class": "img-class1",
                                            "src": "img1.png"
                                        },
                                        {
                                            "type": "img",
                                            "class": "img-class2",
                                            "src": "img2.jpg",
                                            "author": "Nakano Masaki",
                                            "link": "https://namachan10777.github.io"
                                        }
                                    ]
                                }
                            }
                        """)
                        (Ok
                            ( "/"
                            , "cat a b c"
                            , Os.Stdout
                                [ Os.Str "test"
                                , Os.A "Google" "https://google.com"
                                , Os.Img "img-class1" "img1.png" Nothing
                                , Os.Img "img-class2" "img2.jpg" (Just ( "Nakano Masaki", "https://namachan10777.github.io" ))
                                ]
                            )
                        )
            , test "NoCmd" <|
                \_ ->
                    Expect.equal (Decode.decodeString histDecoder """
                    {
                        "dir": "/",
                        "cmd": "pw",
                        "result": {
                            "type": "nocmd"
                        }
                    }
                """)
                        (Ok
                            ( "/"
                            , "pw"
                            , Os.NoCmd
                            )
                        )
            , test "Clear" <|
                \_ ->
                    Expect.equal (Decode.decodeString histDecoder """
                    {
                        "dir": "/",
                        "cmd": "clear",
                        "result": {
                            "type": "clear"
                        }
                    }
                """)
                        (Ok
                            ( "/"
                            , "clear"
                            , Os.Clear
                            )
                        )
            ]
        ]
